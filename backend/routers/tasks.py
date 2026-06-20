from fastapi import APIRouter

router = APIRouter()


@router.get("/pending/{user_id}")
def get_pending_tasks(user_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/tasks/pending/{user_id}"}


@router.get("/completed/{user_id}")
def get_completed_tasks(user_id: int):
    return {"status": "em breve", "endpoint": f"GET /api/tasks/completed/{user_id}"}


@router.post("/scan")
def scan_and_generate():
    return {"status": "em breve", "endpoint": "POST /api/tasks/scan"}


@router.post("/complete/{task_id}")
def complete_task(task_id: int):
    return {"status": "em breve", "endpoint": f"POST /api/tasks/complete/{task_id}"}
