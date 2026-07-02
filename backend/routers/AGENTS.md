# backend/routers/

5 routers stub. Cada um retorna `{"status": "em breve"}`.

| Router | Endpoint prefix | Prioridade |
|---|---|---|
| `products.py` | `/api/products/` | 🔴 Alta — CRUD básico |
| `tasks.py` | `/api/tasks/` | 🔴 Alta — auto-geração |
| `finances.py` | `/api/finances/` | 🟡 Média — upload CSV |
| `agents.py` | `/api/agents/` | 🟡 Média — precisa de LLM |
| `competitors.py` | `/api/competitors/` | 🟢 Baixa — precisa de scraper |

## Padrão de cada router
```python
from fastapi import APIRouter
router = APIRouter(prefix="/api/X", tags=["X"])

@router.get("/")
def list_x():
    return {"status": "em breve"}
```

## Para implementar
- Adicionar `from supabase import create_client` 
- Usar variáveis de ambiente para URL/key
- Retornar JSON com schemas Pydantic