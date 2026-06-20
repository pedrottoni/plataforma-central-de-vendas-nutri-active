from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import products, finances, competitors, agents, tasks

app = FastAPI(
    title="Shopee Growth Quest API",
    description="Backend API for the Shopee dashboard platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(finances.router, prefix="/api/finances", tags=["finances"])
app.include_router(competitors.router, prefix="/api/competitors", tags=["competitors"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}
