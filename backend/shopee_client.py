"""
Shopee Open Platform API client.

Provides HMAC-SHA256 signed requests, OAuth 2.0 flow, and token management
for the Shopee Open Platform integration.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import time
from typing import Any
from urllib.parse import urlencode

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AUTH_BASE_SANDBOX = "https://openplatform.sandbox.test-stable.shopee.sg"
AUTH_BASE_PRODUCTION = "https://open.shopee.com"

API_BASE_SANDBOX = "https://partner.test-stable.shopeemobile.com"
API_BASE_PRODUCTION = "https://partner.shopeemobile.com"

# Token validity windows (seconds)
ACCESS_TOKEN_TTL = 4 * 60 * 60  # ~4 hours
REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60  # ~14 days
TOKEN_EXPIRY_BUFFER = 5 * 60  # 5-minute safety buffer

# Rate-limit: max 100 requests per minute
RATE_LIMIT_MAX = 100
RATE_LIMIT_WINDOW = 60  # seconds


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------


class ShopeeAPIError(Exception):
    """Raised when the Shopee API returns a non-zero error response."""

    def __init__(self, error_code: int, message: str, *, request_path: str = "") -> None:
        self.error_code = error_code
        self.message = message
        self.request_path = request_path
        super().__init__(f"Shopee API error {error_code}: {message} (path={request_path})")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def generate_sign(
    partner_key: str,
    partner_id: str,
    api_path: str,
    timestamp: str | int,
    access_token: str,
    shop_id: str,
) -> str:
    """Compute HMAC-SHA256 signature for a Shopee API request.

    Base string format: ``{partner_id}{api_path}{timestamp}{access_token}{shop_id}``

    Args:
        partner_key: HMAC secret key (never logged).
        partner_id: Partner application ID.
        api_path: API path including leading ``/`` (e.g. ``/v2/product/get``).
        timestamp: Unix epoch seconds as ``int`` or string.
        access_token: Current access token, or ``""`` before authentication.
        shop_id: Shopee shop identifier.

    Returns:
        Lowercase hex-encoded HMAC-SHA256 digest.
    """
    base_string = f"{partner_id}{api_path}{timestamp}{access_token}{shop_id}"
    return hmac.new(
        partner_key.encode("utf-8"),
        base_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class ShopeeClient:
    """High-level client for the Shopee Open Platform API.

    Handles HMAC signing, OAuth 2.0 token exchange, automatic token refresh,
    rate-limit throttling, and retry with exponential backoff.
    """

    def __init__(self) -> None:
        self.partner_id: str = os.getenv("SHOPEE_PARTNER_ID", "")
        self.partner_key: str = os.getenv("SHOPEE_PARTNER_KEY", "")
        self.shop_id: str = os.getenv("SHOPEE_SHOP_ID", "")
        self.env: str = os.getenv("SHOPEE_ENV", "sandbox").lower()

        if not all([self.partner_id, self.partner_key, self.shop_id]):
            logger.warning(
                "Shopee credentials incomplete — check SHOPEE_PARTNER_ID, "
                "SHOPEE_PARTNER_KEY, and SHOPEE_SHOP_ID env vars."
            )

        # Resolve base URLs from environment
        if self.env == "production":
            self.auth_base = AUTH_BASE_PRODUCTION
            self.api_base = API_BASE_PRODUCTION
        else:
            self.auth_base = AUTH_BASE_SANDBOX
            self.api_base = API_BASE_SANDBOX

        logger.info(
            "ShopeeClient initialised (env=%s, shop_id=%s)",
            self.env,
            self.shop_id,
        )

        # Token store
        self.tokens: dict[str, Any] = {
            "access_token": "",
            "refresh_token": "",
            "access_token_expire_time": 0,
        }

        # Rate-limit tracking: list of request timestamps within the window
        self._request_timestamps: list[float] = []

        # HTTP client (persistent connection pool)
        self._http = httpx.Client(timeout=30.0)

    # ------------------------------------------------------------------
    # Token helpers
    # ------------------------------------------------------------------

    def is_token_expired(self) -> bool:
        """Return ``True`` if the access token is expired or about to expire.

        A 5-minute safety buffer is applied before the actual expiry time.
        """
        expire_at: float = self.tokens.get("access_token_expire_time", 0) or 0
        return time.time() >= (expire_at - TOKEN_EXPIRY_BUFFER)

    # ------------------------------------------------------------------
    # OAuth helpers
    # ------------------------------------------------------------------

    def get_auth_url(self, redirect_uri: str) -> str:
        """Build the OAuth authorization URL for the merchant to visit.

        Args:
            redirect_uri: Callback URL registered in the Shopee Partner Console.

        Returns:
            Full authorization URL to redirect the merchant to.
        """
        timestamp = int(time.time())
        sign = generate_sign(
            partner_key=self.partner_key,
            partner_id=self.partner_id,
            api_path="/v2/auth",
            timestamp=timestamp,
            access_token="",
            shop_id=self.shop_id,
        )
        params = {
            "partner_id": self.partner_id,
            "redirect": redirect_uri,
            "timestamp": timestamp,
            "sign": sign,
        }
        return f"{self.auth_base}/v2/auth?{urlencode(params)}"

    def get_access_token(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Exchange an authorization ``code`` for access and refresh tokens.

        Args:
            code: The ``code`` returned in the OAuth callback query string.
            redirect_uri: Must match the URI used in :meth:`get_auth_url`.

        Returns:
            Raw API response dict (includes ``access_token``, ``refresh_token``,
            ``access_token_expire_time``).

        Raises:
            ShopeeAPIError: If the API returns an error response.
        """
        timestamp = int(time.time())
        sign = generate_sign(
            partner_key=self.partner_key,
            partner_id=self.partner_id,
            api_path="/v2/auth/access_token",
            timestamp=timestamp,
            access_token="",
            shop_id=self.shop_id,
        )
        body = {
            "partner_id": int(self.partner_id),
            "code": code,
            "shop_id": int(self.shop_id),
            "redirect_uri": redirect_uri,
        }
        resp = self._http.post(
            f"{self.api_base}/v2/auth/access_token",
            params={"partner_id": self.partner_id, "timestamp": timestamp, "sign": sign},
            json=body,
        )
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        self._handle_api_errors(data, "/v2/auth/access_token")

        # Persist tokens
        self.tokens["access_token"] = data.get("access_token", "")
        self.tokens["refresh_token"] = data.get("refresh_token", "")
        self.tokens["access_token_expire_time"] = time.time() + data.get(
            "access_token_expire_time", ACCESS_TOKEN_TTL
        )
        logger.info("Access token obtained successfully.")
        return data

    def refresh_access_token(self) -> dict[str, Any]:
        """Refresh the access token using the stored refresh token.

        Returns:
            Raw API response dict with new token data.

        Raises:
            ShopeeAPIError: If the refresh request fails or no refresh token exists.
        """
        if not self.tokens.get("refresh_token"):
            raise ShopeeAPIError(
                error_code=-1,
                message="No refresh token available. Run get_access_token first.",
                request_path="/v2/auth/access_token",
            )

        logger.info("Refreshing access token...")
        timestamp = int(time.time())
        sign = generate_sign(
            partner_key=self.partner_key,
            partner_id=self.partner_id,
            api_path="/v2/auth/access_token",
            timestamp=timestamp,
            access_token="",
            shop_id=self.shop_id,
        )
        body = {
            "partner_id": int(self.partner_id),
            "refresh_token": self.tokens["refresh_token"],
            "shop_id": int(self.shop_id),
        }
        resp = self._http.post(
            f"{self.api_base}/v2/auth/access_token",
            params={"partner_id": self.partner_id, "timestamp": timestamp, "sign": sign},
            json=body,
        )
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        self._handle_api_errors(data, "/v2/auth/access_token")

        # Update stored tokens
        self.tokens["access_token"] = data.get("access_token", "")
        self.tokens["refresh_token"] = data.get("refresh_token", self.tokens["refresh_token"])
        self.tokens["access_token_expire_time"] = time.time() + data.get(
            "access_token_expire_time", ACCESS_TOKEN_TTL
        )
        logger.info("Access token refreshed successfully.")
        return data

    # ------------------------------------------------------------------
    # Rate limiting
    # ------------------------------------------------------------------

    def _wait_for_rate_limit(self) -> None:
        """Enforce a simple sliding-window rate limit (100 req / 60 s).

        Blocks the caller until a slot is available.
        """
        now = time.time()
        # Prune timestamps older than the window
        self._request_timestamps = [
            ts for ts in self._request_timestamps if now - ts < RATE_LIMIT_WINDOW
        ]
        if len(self._request_timestamps) >= RATE_LIMIT_MAX:
            oldest = self._request_timestamps[0]
            wait = RATE_LIMIT_WINDOW - (now - oldest) + 0.1  # small epsilon
            if wait > 0:
                logger.warning(
                    "Rate limit reached — sleeping %.1fs (window: %d/%d)",
                    wait,
                    len(self._request_timestamps),
                    RATE_LIMIT_MAX,
                )
                time.sleep(wait)
        self._request_timestamps.append(time.time())

    # ------------------------------------------------------------------
    # Error handling
    # ------------------------------------------------------------------

    @staticmethod
    def _handle_api_errors(data: dict[str, Any], request_path: str) -> None:
        """Inspect Shopee response and raise :class:`ShopeeAPIError` on failure."""
        error = data.get("error")
        error_msg = data.get("message", "")
        if error and error != "":
            # Shopee returns error as a string like "error_sign"
            raise ShopeeAPIError(
                error_code=-1,
                message=f"{error} — {error_msg}",
                request_path=request_path,
            )
        # Also check for non-zero error codes (numeric)
        error_code = data.get("error_code", 0)
        if error_code:
            raise ShopeeAPIError(
                error_code=error_code,
                message=error_msg or f"API returned error_code={error_code}",
                request_path=request_path,
            )

    # ------------------------------------------------------------------
    # Main request wrapper
    # ------------------------------------------------------------------

    def request(
        self,
        method: str,
        api_path: str,
        params: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
        *,
        _retries: int = 3,
    ) -> dict[str, Any]:
        """Send a signed request to the Shopee API.

        Automatically signs with HMAC, refreshes expired tokens, throttles
        to respect rate limits, and retries with exponential backoff on
        transient errors.

        Args:
            method: HTTP method (``GET``, ``POST``, etc.).
            api_path: API path including leading ``/``.
            params: Optional query parameters.
            body: Optional JSON body.

        Returns:
            Parsed JSON response dict (the ``data`` field when present,
            otherwise the full response).

        Raises:
            ShopeeAPIError: On persistent API errors after retries.
        """
        params = dict(params or {})
        # shop_id is required on every call
        params.setdefault("shop_id", self.shop_id)

        last_error: Exception | None = None

        for attempt in range(1, _retries + 1):
            # Ensure we have a valid token
            if self.is_token_expired() and self.tokens.get("refresh_token"):
                try:
                    self.refresh_access_token()
                except ShopeeAPIError as exc:
                    logger.warning("Token refresh failed (attempt %d): %s", attempt, exc.message)
                    raise

            # Throttle
            self._wait_for_rate_limit()

            # Build signature
            timestamp = int(time.time())
            access_token = self.tokens.get("access_token", "")
            sign = generate_sign(
                partner_key=self.partner_key,
                partner_id=self.partner_id,
                api_path=api_path,
                timestamp=timestamp,
                access_token=access_token,
                shop_id=self.shop_id,
            )
            # Merge signature params
            query = {
                "partner_id": self.partner_id,
                "timestamp": timestamp,
                "access_token": access_token,
                "sign": sign,
                **params,
            }

            url = f"{self.api_base}{api_path}"
            logger.debug("Shopee %s %s (attempt %d/%d)", method, api_path, attempt, _retries)

            try:
                if method.upper() == "GET":
                    resp = self._http.get(url, params=query)
                else:
                    resp = self._http.request(method.upper(), url, params=query, json=body)
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "HTTP %s on %s (attempt %d): %s",
                    exc.response.status_code,
                    api_path,
                    attempt,
                    exc.message,
                )
                last_error = exc
                # Exponential backoff
                time.sleep(2 ** (attempt - 1))
                continue
            except httpx.RequestError as exc:
                logger.warning("Request error on %s (attempt %d): %s", api_path, attempt, exc)
                last_error = exc
                time.sleep(2 ** (attempt - 1))
                continue

            data: dict[str, Any] = resp.json()

            # Check for Shopee-level errors
            try:
                self._handle_api_errors(data, api_path)
            except ShopeeAPIError as exc:
                # Rate limit → retry with backoff
                if "error_ratelimit" in exc.message:
                    logger.warning(
                        "Rate-limited on %s (attempt %d/%d) — backing off",
                        api_path,
                        attempt,
                        _retries,
                    )
                    last_error = exc
                    time.sleep(min(2 ** attempt, 30))
                    continue
                # Token errors → refresh and retry
                if "error_token" in exc.message and self.tokens.get("refresh_token"):
                    logger.warning(
                        "Token error on %s — attempting refresh (attempt %d)",
                        api_path,
                        attempt,
                    )
                    try:
                        self.refresh_access_token()
                        last_error = exc
                        continue
                    except ShopeeAPIError as refresh_exc:
                        logger.warning("Refresh failed: %s", refresh_exc.message)
                # Sign or auth errors are not retryable
                raise

            return data

        # Exhausted retries
        if isinstance(last_error, ShopeeAPIError):
            raise last_error
        raise ShopeeAPIError(
            error_code=-1,
            message=f"Request failed after {_retries} retries: {last_error}",
            request_path=api_path,
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._http.close()

    def __enter__(self) -> ShopeeClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
