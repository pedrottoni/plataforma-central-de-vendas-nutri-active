from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_products():
    return {"status": "em breve", "endpoint": "GET /api/products"}


@router.get("/{product_id}")
def get_product(product_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/products/{product_id}"}


@router.post("/")
def create_product():
    return {"status": "em breve", "endpoint": "POST /api/products"}


@router.put("/{product_id}")
def update_product(product_id: int):
    return {"status": "em breve", "endpoint": f"PUT /api/products/{product_id}"}


@router.delete("/{product_id}")
def delete_product(product_id: int):
    return {"status": "em breve", "endpoint": f"DELETE /api/products/{product_id}"}
