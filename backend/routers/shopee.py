"""
Shopee integration router.

Provides OAuth 2.0 authorization flow, token management,
connection status checks, and a generic signed proxy for any Shopee API call.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from supabase import create_client

from ..shopee_client import ShopeeClient, ShopeeAPIError

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/shopee", tags=["shopee"])

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------


def _get_supabase():
    """Create and return a Supabase client from env vars."""
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class ProxyRequest(BaseModel):
    """Body for the generic Shopee proxy endpoint."""

    method: str = "GET"
    path: str
    params: dict[str, Any] = {}
    body: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/auth/url")
def get_auth_url() -> dict[str, str]:
    """Return the Shopee OAuth authorization URL.

    The merchant should be redirected to this URL to grant access.
    The ``redirect_uri`` is read from the ``SHOPEE_REDIRECT_URI`` env var.
    """
    redirect_uri = os.getenv("SHOPEE_REDIRECT_URI", "http://localhost:8000/api/shopee/callback")
    client = ShopeeClient()
    url = client.get_auth_url(redirect_uri)
    return {"url": url}


@router.get("/callback")
def oauth_callback(
    code: str = Query(..., description="Authorization code from Shopee"),
    shop_id: str = Query(..., description="Shopee shop identifier"),
) -> dict[str, Any]:
    """Handle the OAuth callback from Shopee.

    Exchanges the authorization ``code`` for access/refresh tokens and
    persists them in the ``shopee_tokens`` Supabase table (upserted by
    ``shop_id``).

    Returns:
        ``{"status": "connected", "shop_id": "<id>"}`` on success.

    Raises:
        HTTP 400 on any error during token exchange or persistence.
    """
    redirect_uri = os.getenv("SHOPEE_REDIRECT_URI", "http://localhost:8000/api/shopee/callback")
    client = ShopeeClient()

    try:
        token_data = client.get_access_token(code, redirect_uri)
    except ShopeeAPIError as exc:
        return {"error": exc.message}
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)}

    # Persist tokens to Supabase
    try:
        sb = _get_supabase()
        expire_ts = token_data.get("access_token_expire_time", 0)
        sb.table("shopee_tokens").upsert(
            {
                "shop_id": str(shop_id),
                "access_token": token_data.get("access_token", ""),
                "refresh_token": token_data.get("refresh_token", ""),
                "access_token_expire_time": expire_ts,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="shop_id",
        ).execute()
    except Exception as exc:  # noqa: BLE001
        return {"error": f"Token exchange succeeded but persistence failed: {exc}"}

    return {"status": "connected", "shop_id": str(shop_id)}


@router.get("/status")
def connection_status() -> dict[str, Any]:
    """Check whether a Shopee token is stored and currently valid.

    Returns:
        ``{"connected": bool, "shop_id": str|None, "expires_at": str|None}``
    """
    try:
        sb = _get_supabase()
        result = sb.table("shopee_tokens").select("*").limit(1).execute()
    except Exception:
        # Supabase not configured or table missing — treat as disconnected
        return {"connected": False, "shop_id": None, "expires_at": None}

    rows = result.data if result.data else []
    if not rows:
        return {"connected": False, "shop_id": None, "expires_at": None}

    row = rows[0]
    expire_ts = row.get("access_token_expire_time", 0)
    now = datetime.now(timezone.utc).timestamp()
    connected = bool(row.get("access_token")) and expire_ts > now
    expires_at = (
        datetime.fromtimestamp(expire_ts, tz=timezone.utc).isoformat()
        if connected and expire_ts
        else None
    )

    return {
        "connected": connected,
        "shop_id": row.get("shop_id"),
        "expires_at": expires_at,
    }


@router.post("/proxy")
def shopee_proxy(req: ProxyRequest) -> dict[str, Any]:
    """Forward a signed request to the Shopee Open Platform API.

    Accepts any API method and path, signs the request with the stored
    credentials, and returns the Shopee response directly.

    Body:
        method: HTTP verb (``GET`` or ``POST``).
        path:   API path with leading ``/`` (e.g. ``/v2/product/get``).
        params: Optional query parameters.
        body:   Optional JSON body for POST requests.
    """
    client = ShopeeClient()

    try:
        data = client.request(
            method=req.method,
            api_path=req.path,
            params=req.params or None,
            body=req.body or None,
        )
        return data
    except ShopeeAPIError as exc:
        raise HTTPException(status_code=502, detail={"error": exc.message})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail={"error": str(exc)})


@router.post("/refresh")
def force_refresh() -> dict[str, Any]:
    """Force-refresh the Shopee access token.

    Uses the stored refresh token to obtain a new access token. The new
    token is persisted to Supabase but **not** exposed in the response.

    Returns:
        ``{"status": "refreshed", "expires_at": str}`` on success.

    Raises:
        HTTP 500 on refresh failure.
    """
    client = ShopeeClient()

    # Load existing refresh token from Supabase
    try:
        sb = _get_supabase()
        result = sb.table("shopee_tokens").select("*").limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"error": f"Cannot read tokens: {exc}"})

    rows = result.data if result.data else []
    if not rows:
        raise HTTPException(status_code=400, detail={"error": "No stored token. Run the OAuth flow first."})

    row = rows[0]
    client.tokens["access_token"] = row.get("access_token", "")
    client.tokens["refresh_token"] = row.get("refresh_token", "")
    client.tokens["access_token_expire_time"] = row.get("access_token_expire_time", 0)

    try:
        new_data = client.refresh_access_token()
    except ShopeeAPIError as exc:
        raise HTTPException(status_code=500, detail={"error": exc.message})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail={"error": str(exc)})

    # Persist refreshed tokens
    try:
        expire_ts = new_data.get("access_token_expire_time", 0)
        sb.table("shopee_tokens").upsert(
            {
                "shop_id": row["shop_id"],
                "access_token": client.tokens["access_token"],
                "refresh_token": client.tokens["refresh_token"],
                "access_token_expire_time": expire_ts,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="shop_id",
        ).execute()
    except Exception as exc:  # noqa: BLE001
        return {"error": f"Refresh succeeded but persistence failed: {exc}"}

    expires_at = datetime.fromtimestamp(
        client.tokens["access_token_expire_time"], tz=timezone.utc
    ).isoformat()
    return {"status": "refreshed", "expires_at": expires_at}
