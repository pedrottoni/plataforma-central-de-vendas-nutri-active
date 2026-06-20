from fastapi import APIRouter

router = APIRouter()


@router.post("/search")
def search_competitors():
    return {"status": "em breve", "endpoint": "POST /api/competitors/search"}


@router.get("/badge/{product_id}")
def get_badge(product_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/competitors/badge/{product_id}"}


@router.get("/listings/{product_id}")
def get_listings(product_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/competitors/listings/{product_id}"}


@router.post("/confirm/{listing_id}")
def confirm_match(listing_id: int):
    return {"status": "em breve", "endpoint": f"POST /api/competitors/confirm/{listing_id}"}
