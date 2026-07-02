# Shopee Open Platform — Integração Riscos & Guidelines

> **Para LLMs e desenvolvedores**: Este documento define o que FAZER e o que NÃO FAZER ao trabalhar com a integração Shopee Open Platform neste projeto.

---

## 📍 Contexto do Projeto

| Item | Valor |
|------|-------|
| **Loja** | DailyLife Nutri Active |
| **Marketplace** | Shopee (Brasil) |
| **Ambiente** | Sandbox (teste) |
| **Shop ID** | 227572239 |
| **Shop Account** | SANDBOX.ac373cbf5ae0b57738e3 |
| **Área** | Local - BR |
| **Backend** | FastAPI (Python) |
| **Frontend** | React + Vite + TypeScript |

---

## 🔑 Credenciais — NUNCA FAÇA

| ❌ NÃO FAÇA | ✅ FAÇA |
|-------------|---------|
| Hardcode Partner Key no código | Use `os.getenv("SHOPEE_PARTNER_KEY")` |
| Commitar `.env` no Git | Adicione `.env` ao `.gitignore` |
| Exibir keys em logs ou erros | Use `logger.info("Partner key configurada")` sem valor |
| Salvar tokens em localStorage do frontend | Salve tokens no backend (Supabase) |
| Enviar credenciais via query params | Use body ou headers |
| Criar `.env` com valores fake para teste | Use variáveis de ambiente reais do sandbox |

---

## 🔐 Autenticação — O que saber

### OAuth 2.0 Flow

```
1. GET /v2/auth/access_token (para apps public — NÃO é o nosso caso)
2. Para apps privados: gera auth URL → redirect → callback com code → POST /v2/auth/access_token
```

**Nossa arquitetura**: App privado (só Pedro usa). OAuth flow completo necessário.

### HMAC-SHA256 Signature

```python
# FÓRMULA CORRETA:
sign = HMAC-SHA256(
    partner_key,
    f"{partner_id}{api_path}{timestamp}{access_token}{shop_id}"
)
```

| ⚠️ Cuidado | Detalhe |
|------------|---------|
| Timestamp | **Segundos** (int), NÃO milliseconds |
| api_path | Inclui `/` no início, ex: `/v2/product/get` |
| access_token | String vazia na primeira chamada (antes de autenticar) |
| shop_id | Obrigatório em todas as chamadas |
| Encoding | UTF-8 para o base_string |

### Tokens

| Token | Validade | Uso |
|-------|----------|-----|
| `access_token` | ~4 horas | Chamadas API |
| `refresh_token` | ~14 dias | Renovar access_token |

**REGRA**: Sempre verificar se token expirou antes de chamar API. Se expirou, usar refresh_token.

---

## 🌐 URLs — Sandbox vs Produção

### URLs de AUTH

| Ambiente | URL |
|----------|-----|
| **Sandbox** | `https://openplatform.sandbox.test-stable.shopee.sg` |
| **Produção** | `https://open.shopee.com` |

### URLs de API

| Ambiente | URL |
|----------|-----|
| **Sandbox** | `https://partner.test-stable.shopeemobile.com` |
| **Produção** | `https://partner.shopeemobile.com` |

### Redirect URI (Callback)

| Ambiente | URI |
|----------|-----|
| **Sandbox** | `http://localhost:8000/api/shopee/callback` |
| **Produção** | `https://seudominio.com/api/shopee/callback` |

**⚠️ CUIDADO**: O Redirect URI no Console do Shopee DEVE bater EXATAMENTE com o que o backend envia. Um caractere diferente = auth falha.

---

## 📡 Endpoints Principais

### Produtos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/v2/product/get` | GET | Detalhes de 1 produto |
| `/v2/product/get_item_list` | GET | Lista todos os produtos da loja |
| `/v2/product/search` | GET | Buscar produtos |
| `/v2/product/update` | POST | Atualizar produto |
| `/v2/product/insert` | POST | Criar produto |
| `/v2/product/delete` | POST | Deletar produto |
| `/v2/product/get_stock` | GET | Consultar estoque |
| `/v2/product/update_stock` | POST | Atualizar estoque |

### Pedidos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/v2/order/get_order_list` | GET | Lista pedidos |
| `/v2/order/get_order_detail` | GET | Detalhe do pedido |
| `/v2/order/order_status` | GET | Status do pedido |

### Financeiro

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/v2/finance/get_wallet` | GET | Saldo da carteira |
| `/v2/finance/get_transaction_list` | GET | Lista de transações |

### Loja

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/v2/shop/get_shop_info` | GET | Dados da loja |

---

## ⚠️ Riscos Conhecidos

### 1. Sandbox ≠ Produção

| Aspecto | Sandbox | Produção |
|---------|---------|----------|
| Dados | Fictícios | Reais |
| Frete (Shopee Xpress) | Não funciona | Funciona |
| Ads API | Não disponível | Disponível |
| Rate limit | Mais permissivo | Mais restritivo |
| Pagamentos | Simulados | Reais |

**REGRA**: Sempre testar no sandbox primeiro. Nunca usar credenciais de produção para desenvolvimento.

### 2. Rate Limits

| API | Limite | Erro |
|-----|--------|------|
| Produtos | ~100 req/min | `error_ratelimit` |
| Pedidos | ~100 req/min | `error_ratelimit` |
| Geral | ~1000 req/hora | `error_ratelimit` |

**REGRA**: Implementar retry com backoff exponencial. Não fazer polling agressivo.

### 3. Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `error_sign` | HMAC inválido | Verificar base_string e timestamp |
| `error_token` | Token expirado/inválido | Usar refresh_token |
| `error_auth` | Credenciais erradas | Verificar partner_id/key |
| `error_param` | Parâmetro faltando | Verificar documentação do endpoint |
| `error_permission` | App não tem acesso | Verificar scopes no Console |

### 4. Transação (Venda) no Shopee

**⚠️ CRÍTICO**: A API Shopee retorna `order_status`, não uma transação financeira direta.

- `COMPLETE` = Pedido entregue e pago
- `REVIEW` = Pedido em review
- `CANCELLED` = Cancelado
- `TO_CONFIRM_RECEIVE` = Aguardando confirmação

**REGRA**: Só considerar como "venda" no Supabase quando status = `COMPLETE` ou `REVIEW` (depende da política).

### 5. Produtos no Sandbox

- Sandbox retorna produtos **fictícios** — não são os mesmos da loja real
- Para testar com dados reais, usar **produção** (com cautela)
- IDs de produto no sandbox são diferentes dos de produção

---

## ✅ Checklist de Implementação

- [ ] HMAC signature gerada corretamente (base_string + timestamp segundos)
- [ ] Tokens salvos no Supabase (não no frontend)
- [ ] Refresh automático de tokens antes de expirar
- [ ] Rate limiting implementado (max 100 req/min)
- [ ] Erros tratados (sign, token, auth, param, permission)
- [ ] Redirect URI configurado no Console = exatamente o que o backend usa
- [ ] `.env` no `.gitignore` (nunca commitar credenciais)
- [ ] Logs não expõem secrets
- [ ] Testado no sandbox antes de migrar pra produção

---

## 🚫 O que NUNCA fazer

1. **NUNCA** usar credenciais de produção em código de desenvolvimento
2. **NUNCA** commitar `.env` ou keys no Git
3. **NUNCA** usar `timestamp` em milliseconds (API espera segundos)
4. **NUNCA** fazer chamadas sem HMAC signature
5. **NUNCA** ignorar erros de rate limit (implementar backoff)
6. **NUNCA** assumir que sandbox = produção (dados diferentes, endpoints diferentes)
7. **NUNCA** salvar tokens no localStorage do browser
8. **NUNCA** expor `partner_key` em logs ou mensagens de erro
9. **NUNCA** fazer polling agressivo (< 1s entre chamadas)
10. **NUNCA** mudar URLs de API sem atualizar `.env`

---

## 📂 Arquivos Relevantes

| Arquivo | Descrição |
|---------|-----------|
| `backend/shopee_client.py` | Client HTTP com HMAC + OAuth |
| `backend/routers/shopee.py` | Endpoints de auth + proxy |
| `backend/main.py` | Registro de routers |
| `backend/.env` | Credenciais (NUNCA commitar) |
| `backend/.env.example` | Template das variáveis |
| `references/shopee-integration.md` | Este arquivo |
| `KANBAN.md` | Task tracking |
