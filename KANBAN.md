# KANBAN — Plataforma Central × Shopee Open Platform

> Última atualização: 2026-07-01

---

## 📋 BACKLOG

| ID | Tarefa | Prioridade | Notas |
|----|--------|------------|-------|
| S-01 | Criar `backend/shopee_client.py` (HMAC + OAuth) | 🔴 Alta | Core da integração |
| S-02 | Criar `backend/routers/shopee.py` | 🔴 Alta | Endpoints auth + proxy |
| S-03 | Registrar router em `main.py` | 🔴 Alta | Depends S-02 |
| ~~S-04~~ | ~~Atualizar `backend/.env.example`~~ | ~~🟡 Média~~ | ✅ Concluído |
| ~~S-05~~ | ~~Criar `backend/.env` com credenciais sandbox~~ | ~~🔴 Alta~~ | ✅ Concluído |
| S-06 | Adicionar `httpx` ao `requirements.txt` | 🟡 Média | Dependência HTTP |
| S-07 | Migration: tabela `shopee_tokens` | 🟡 Média | Salvar tokens por loja |
| S-08 | Atualizar `frontend/Configuracoes.tsx` | 🟡 Média | Botão "Conectar Shopee" |
| S-09 | Testar handshake no sandbox | 🔴 Alta | Validar auth flow |
| ~~S-10~~ | ~~Criar `references/shopee-integration.md`~~ | ~~🟡 Média~~ | ✅ Concluído |

---

## 🔵 EM PROGRESSO

| ID | Tarefa | Início | Responsável |
|----|--------|--------|-------------|
| — | — | — | — |

---

## ✅ CONCLUÍDO

| ID | Tarefa | Concluído | Commit |
|----|--------|-----------|--------|
| S-04 | Atualizar `backend/.env.example` | 2026-07-01 | — |
| S-05 | Criar `backend/.env` com credenciais sandbox | 2026-07-01 | — |
| S-10 | Criar `references/shopee-integration.md` | 2026-07-01 | — |

---

## 📌 Definições

- **Prioridade 🔴 Alta**: Bloqueia outras tarefas ou é pré-requisito
- **Prioridade 🟡 Média**: Importante mas não bloqueia
- **Prioridade 🟢 Baixa**: Nice-to-have, pode esperar

---

## 🔄 Ordem de Execução Recomendada

```
S-10 (docs) → S-05 (.env) → S-04 (.env.example) → S-06 (httpx)
    → S-01 (client) → S-02 (router) → S-03 (main.py)
    → S-07 (migration) → S-08 (frontend) → S-09 (teste sandbox)
```
