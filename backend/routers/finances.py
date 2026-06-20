from fastapi import APIRouter

router = APIRouter()


@router.get("/stats/{user_id}")
def get_financial_stats(user_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/finances/stats/{user_id}"}


@router.get("/transactions/{user_id}")
def list_transactions(user_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/finances/transactions/{user_id}"}


@router.post("/upload")
def process_upload():
    return {"status": "em breve", "endpoint": "POST /api/finances/upload"}


@router.post("/calculate-order")
def calculate_order():
    return {"status": "em breve", "endpoint": "POST /api/finances/calculate-order"}
