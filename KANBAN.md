# KANBAN — Plataforma Central

> Última atualização: 2026-07-05

---

## 📋 BACKLOG

| ID | Tarefa | Prioridade | Notas |
|----|--------|------------|-------|
| B-01 | Upload CSV de pedidos Shopee (manual) | 🔴 Alta | Importar dados de vendas sem API |
| B-02 | Controle de estoque com alertas | 🟡 Média | Baixo estoque, giro, alertas |
| B-03 | Gráficos de vendas por período | 🟡 Média | Recharts — receita, unidades, ticket médio |
| B-04 | IA/LLM para análise de concorrência | 🟢 Baixa | Futuro |
| B-05 | Página Marketing com dados reais | 🟡 Média | Campanhas, ROI, CAC |
| B-06 | Página Atendimento funcional | 🟢 Baixa | Chat, tickets |
| B-07 | Página Concorrência funcional | 🟢 Baixa | Price monitoring |

---

## 🔵 EM PROGRESSO

| ID | Tarefa | Início | Responsável |
|----|--------|--------|-------------|
| — | — | — | — |

---

## ✅ CONCLUÍDO

| ID | Tarefa | Concluído |
|----|--------|-----------|
| Setup | Frontend React + Vite + shadcn/ui | 2026-07-01 |
| Setup | Backend FastAPI (stubs) | 2026-07-01 |
| Setup | Supabase schema (10 tabelas) | 2026-07-01 |
| Setup | RLS policies | 2026-07-01 |
| P-01 | Página Resumo com KPIs reais | 2026-07-01 |
| P-02 | Página Meus Anúncios com dados reais | 2026-07-01 |
| P-03 | Página Financeiro com dados reais | 2026-07-01 |
| P-04 | Página Tarefas com dados reais | 2026-07-01 |
| P-05 | Página Configurações | 2026-07-01 |
| Deploy | Vercel (frontend) | 2026-07-01 |
| S-01 | Shopee — auth + token management | 2026-07-02 |
| S-02 | Shopee — sync products | 2026-07-02 |
| S-03 | Shopee — sync orders | 2026-07-02 |
| S-04 | Shopee — sync shop info | 2026-07-02 |
| S-05 | Shopee — get order detail | 2026-07-02 |
| S-06 | Shopee — get order list | 2026-07-02 |
| S-07 | Shopee — update price/stock | 2026-07-02 |
| S-08 | Shopee — webhook endpoint | 2026-07-02 |
| S-09 | **REVERT:** Remover Shopee Open Platform — manter apenas Supabase | 2026-07-04 |
| Kit #1 | Fix: kit sales — sold_count no kit, não componentes | 2026-07-04 |
| Kit #2 | Fix: kit revenue — transactions.amount como source of truth | 2026-07-04 |
| Kit #3 | Fix: variation_id + sold_count sync em Financeiro | 2026-07-04 |

---

## 📌 Definições

- **Prioridade 🔴 Alta**: Bloqueia outras tarefas ou é pré-requisito
- **Prioridade 🟡 Média**: Importante mas não bloqueia
- **Prioridade 🟢 Baixa**: Nice-to-have, pode esperar