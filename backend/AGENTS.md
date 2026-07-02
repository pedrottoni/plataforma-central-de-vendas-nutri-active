# backend/

FastAPI (Python). Todos os endpoints são stubs — retornam `{"status": "em breve"}`.

## Estrutura
| Arquivo | Rota | O que faz |
|---|---|---|
| `main.py` | — | App FastAPI, CORS, registra routers |
| `routers/products.py` | `/api/products/` | CRUD produtos |
| `routers/finances.py` | `/api/finances/` | Stats financeiros |
| `routers/agents.py` | `/api/agents/` | IA (geração, análise, prompts) |
| `routers/tasks.py` | `/api/tasks/` | Engine de tarefas |
| `routers/competitors.py` | `/api/competitors/` | Scraping concorrentes |

## Rodar
```bash
uvicorn main:app --reload
```

## Para implementar
1. Conectar routers com Supabase (usar `supabase-py`)
2. `agents.py` → integração com LLM (OpenAI/custom)
3. `competitors.py` → scraper (Firecrawl/browser)
4. `finances.py` → parse CSV do Seller Center