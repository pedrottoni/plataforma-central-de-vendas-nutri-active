import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { DollarSign, TrendingUp, AlertTriangle, Info } from 'lucide-react'
import type { Product } from '@/hooks/use-data'

// ── Modelo de custos (Shopee 2026, vendedor CNPJ) ──
// Fonte: seller.br.shopee.cn/edu/article/26839 + extratos reais do Pedro.
// A "Taxa por item" e a COMISSÃO são ESCALONADAS por faixa de preço líquido
// (preço após cupom). Abaixo de R$80: comissão 20% + taxa R$4. Acima: 14% + R$16.
// threshold oficial = R$79,99 (usamos 80).
// Simples 4% = alíquota EFETIVA do DAS 07/2026 (510,93 / 12.773,52).

interface FeeTier {
  threshold: number        // teto da faixa (preço líquido <= threshold)
  comissao: number         // % comissão nesta faixa
  itemFee: number          // taxa fixa por item nesta faixa
}

interface FeeParam {
  key: string
  label: string
  /** 'pct' = percentual sobre o preço líquido; 'fixed' = valor fixo por pedido */
  kind: 'pct' | 'fixed'
  value: number
  editable: boolean
}

// Faixas oficiais (CNPJ). Editáveis.
const DEFAULT_TIERS: FeeTier[] = [
  { threshold: 79.99, comissao: 20, itemFee: 4 },
  { threshold: 99.99, comissao: 14, itemFee: 16 },
  { threshold: 199.99, comissao: 14, itemFee: 20 },
  { threshold: 499.99, comissao: 14, itemFee: 26 },
  { threshold: Infinity, comissao: 14, itemFee: 26 },
]

// Taxas % sobre o preço líquido (fora a comissão, que é por faixa).
// Defaults calibrados nos extratos reais do Pedro.
const DEFAULT_FEES: FeeParam[] = [
  { key: 'ads', label: 'Ads Fácil', kind: 'pct', value: 5, editable: true },
  { key: 'servico_adic', label: 'Serviço Adicional', kind: 'pct', value: 3.5, editable: true },
  { key: 'transacao', label: 'Taxa de Transação', kind: 'pct', value: 2, editable: true },
  { key: 'recarga', label: 'Recarga Automática', kind: 'pct', value: 2, editable: true },
  { key: 'devolucao', label: 'Devolução Fácil', kind: 'pct', value: 0.5, editable: true },
  { key: 'simples', label: 'Simples Nacional (DAS)', kind: 'pct', value: 4, editable: true },
]

function tierFor(precoLiquido: number): FeeTier {
  return DEFAULT_TIERS.find(t => precoLiquido <= t.threshold) ?? DEFAULT_TIERS[DEFAULT_TIERS.length - 1]
}

function brl(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  products: Product[]
}

export function PrecificacaoCalc({ products }: Props) {
  // ── Inputs principais ──
  const [price, setPrice] = useState<string>('')
  const [cost, setCost] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')

  // ── Parâmetros editáveis ──
  const [fees, setFees] = useState<FeeParam[]>(DEFAULT_FEES)
  const [tiers, setTiers] = useState<FeeTier[]>(DEFAULT_TIERS)

  // ── Toggles / promoções ──
  const [pix, setPix] = useState(true) // PIX dá desconto na Shopee (~5%)
  const [amp, setAmp] = useState(false) // Acréscimo por Método de Pagamento (parcelado)
  const [cupomPct, setCupomPct] = useState<string>('') // promoção aplicada na plataforma
  const [freteComprador, setFreteComprador] = useState<string>('') // frete pago pelo comprador (R$)
  const [targetMargin, setTargetMargin] = useState<string>('30') // margem líquida desejada % (solver reverso)

  const pixPct = 5 // desconto PIX padrão (editável via toggle on/off)
  const ampPct = 2 // AMP estimado sobre preço quando parcelado

  const updateFee = (key: string, value: number) =>
    setFees(prev => prev.map(f => (f.key === key ? { ...f, value } : f)))

  // Pre-fill do custo ao selecionar produto
  const onSelectProduct = (id: string | number) => {
    const numId = Number(id)
    setSelectedProductId(numId)
    const p = products.find(x => x.id === numId)
    if (p && p.supplier_price > 0) setCost(String(p.supplier_price))
  }

  const calc = useMemo(() => {
    const priceNum = parseFloat(price) || 0
    const costNum = parseFloat(cost) || 0
    const cupom = (parseFloat(cupomPct) || 0) / 100

    if (priceNum <= 0) {
      return { valid: false, lines: [], renda: 0, lucro: 0, margem: 0, itemFeeApplied: 0, cupomValue: 0 }
    }

    // 1) Cupom / promoção reduz o preço base
    const cupomValue = priceNum * cupom
    const precoLiquido = priceNum - cupomValue

    // 2) Taxas percentuais sobre o preço líquido (exceto comissão, que é por faixa)
    const tier = tierFor(precoLiquido)
    const pctLines = fees.map(f => ({
      key: f.key,
      label: f.label,
      amount: -(precoLiquido * f.value) / 100,
    }))
    const comissaoLine = { key: 'comissao', label: `Taxa de Comissão (${tier.comissao}%)`, amount: -(precoLiquido * tier.comissao) / 100 }

    // 3) Taxa por item (escalonada por faixa)
    const itemFeeApplied = tier.itemFee
    const itemLine = { key: 'item', label: `Taxa por item (faixa ${precoLiquido <= 79.99 ? 'baixa' : 'alta'})`, amount: -itemFeeApplied }

    // 4) PIX (desconto) / AMP (acréscimo)
    const pixLine = pix ? { key: 'pix', label: 'Desconto PIX', amount: precoLiquido * pixPct / 100 } : null
    const freteComp = parseFloat(freteComprador) || 0
    const ampLine = amp ? { key: 'amp', label: 'AMP (parcelado)', amount: -(precoLiquido * ampPct) / 100 } : null

    const lines = [
      { key: 'preco', label: 'Preço do Produto', amount: priceNum },
      ...(cupom > 0 ? [{ key: 'cupom', label: 'Cupom / Promoção', amount: -cupomValue }] : []),
      comissaoLine,
      ...pctLines,
      itemLine,
      ...(pixLine ? [pixLine] : []),
      ...(ampLine ? [ampLine] : []),
    ]

    const renda = lines.reduce((s, l) => s + l.amount, 0)
    const lucro = renda - costNum
    const margem = renda > 0 ? (lucro / renda) * 100 : 0
    // Valor que o comprador paga no checkout (não afeta a renda do vendedor)
    const pagamentoComprador = precoLiquido + freteComp

    return { valid: true, lines, renda, lucro, margem, itemFeeApplied, cupomValue, pagamentoComprador }
  }, [price, cost, cupomPct, freteComprador, fees, tiers, pix, amp])

  // Alerta de faixa: se está na faixa alta, dividir pode reduzir a taxa por item
  const priceNum = parseFloat(price) || 0
  const inHighTier = calc.valid && priceNum > 79.99
  const pctItemShare = calc.valid && priceNum > 0 ? (calc.itemFeeApplied / priceNum) * 100 : 0

  // ── Solver reverso: preço-alvo dada uma margem líquida desejada ──
  // renda = P·s·k − F,  onde s=(1−cupom), k=(1+PIX−AMP−Σtaxas), F=taxa_item
  // margem m → renda = custo/(1−m)  →  P = (custo/(1−m) + F) / k
  // F é escalonado (faixa baixa/alta) → testamos consistência de tier.
  const solver = useMemo(() => {
    const costNum = parseFloat(cost) || 0
    const m = (parseFloat(targetMargin) || 0) / 100
    if (costNum <= 0 || m < 0 || m >= 1) return null
    const s = 1 - ((parseFloat(cupomPct) || 0) / 100)
    const pctSum = fees.reduce((acc, f) => acc + f.value / 100, 0)
    const pixEff = pix ? pixPct / 100 : 0
    const ampEff = amp ? ampPct / 100 : 0
    const kBase = s * (1 + pixEff - ampEff - pctSum) // coeficiente das taxas % (sem comissão/taxa-item)
    if (kBase <= 0) return { infeasible: true as const }
    // Para cada faixa, comissão c e taxa-item F: renda = P·s·(kBase) − P·s·c − F
    //   = P·s·(kBase − c) − F. Margem m → renda = custo/(1−m).
    //   P = (custo/(1−m) + F) / (s·(kBase − c))
    let chosen: { P: number; PL: number; F: number; tier: string; comissao: number } | null = null
    for (const t of tiers) {
      const denom = s * (kBase - t.comissao / 100)
      if (denom <= 0) continue
      const P = (costNum / (1 - m) + t.itemFee) / denom
      const PL = P * s
      if (PL <= t.threshold) { chosen = { P, PL, F: t.itemFee, tier: `até ${t.threshold === Infinity ? '∞' : brl(t.threshold)}`, comissao: t.comissao }; break }
    }
    if (!chosen) {
      const last = tiers[tiers.length - 1]
      const denom = s * (kBase - last.comissao / 100)
      if (denom <= 0) return { infeasible: true as const }
      const P = (costNum / (1 - m) + last.itemFee) / denom
      chosen = { P, PL: P * s, F: last.itemFee, tier: 'alta (aprox.)', comissao: last.comissao }
    }
    const renda = chosen.PL * (kBase - chosen.comissao / 100) - chosen.F
    const lucro = renda - costNum
    const margemReal = renda > 0 ? (lucro / renda) * 100 : 0
    return { infeasible: false as const, price: chosen.P, tier: chosen.tier, lucro, margemReal }
  }, [cost, targetMargin, cupomPct, fees, tiers, pix, amp, pixPct, ampPct])

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* ── Coluna: Inputs ── */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropdown de produto */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Produto (opcional — pré-preenche o custo)</label>
            <CustomSelect
              value={selectedProductId}
              placeholder="Selecionar produto..."
              options={[...products].sort((a, b) => a.title.localeCompare(b.title)).map(p => ({ value: p.id, label: p.title, sublabel: brl(p.supplier_price) }))}
              onChange={onSelectProduct}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Preço de Venda (R$)</label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Custo do Fornecedor (R$)</label>
              <input
                type="number" value={cost} onChange={e => setCost(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Promoções / cupom */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Promoção na Shopee (cupom %)</label>
            <input
              type="number" value={cupomPct} onChange={e => setCupomPct(e.target.value)}
              placeholder="0"
              className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">Ex.: campanha de 10% off → digite 10. Reduz o preço base antes das taxas.</p>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: 'PIX (-5%)', on: pix, set: setPix },
              { label: 'AMP (parcelado)', on: amp, set: setAmp },
            ].map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => t.set(!t.on)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  t.on ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {t.label}
              </button>
            ))}

          {/* Frete pago pelo comprador (R$) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Frete pago pelo comprador (R$)</label>
            <input
              type="number" value={freteComprador} onChange={e => setFreteComprador(e.target.value)}
              placeholder="0,00"
              className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">Valor que aparece no checkout somado ao preço. Não afeta sua renda (Shopee repassa).</p>
          </div>
          </div>

          {/* Parâmetros de taxa (editáveis) */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Taxas (% sobre preço líquido)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {fees.map(f => (
                <div key={f.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">{f.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number" step="0.1" value={f.value}
                      onChange={e => updateFee(f.key, parseFloat(e.target.value) || 0)}
                      className="w-14 h-7 px-1.5 rounded-md bg-secondary border border-border text-xs font-mono-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Taxas por faixa (editáveis) */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Faixas de Comissão + Taxa por Item</p>
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
              <span />
              <span className="text-center">Até R$</span>
              <span className="text-center">Comissão %</span>
              <span className="text-center">Taxa item R$</span>
            </div>
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-2 gap-y-1 items-center mt-1">
                <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                <input
                  type="number" value={t.threshold === Infinity ? '' : t.threshold}
                  placeholder="∞"
                  onChange={e => setTiers(prev => prev.map((x, j) => j === i ? { ...x, threshold: e.target.value === '' ? Infinity : (parseFloat(e.target.value) || 0) } : x))}
                  className="w-full h-7 px-1.5 rounded-md bg-secondary border border-border text-xs font-mono-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="number" step="0.1" value={t.comissao}
                  onChange={e => setTiers(prev => prev.map((x, j) => j === i ? { ...x, comissao: parseFloat(e.target.value) || 0 } : x))}
                  className="w-full h-7 px-1.5 rounded-md bg-secondary border border-border text-xs font-mono-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="number" step="0.1" value={t.itemFee}
                  onChange={e => setTiers(prev => prev.map((x, j) => j === i ? { ...x, itemFee: parseFloat(e.target.value) || 0 } : x))}
                  className="w-full h-7 px-1.5 rounded-md bg-secondary border border-border text-xs font-mono-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Coluna: Resultado ── */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Resultado Estimado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!calc.valid ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Digite o Preço de Venda para simular a precificação.
            </p>
          ) : (
            <>
              {/* Breakdown */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/40">
                  <span>Item</span><span className="text-right">Valor</span>
                </div>
                {calc.lines.map((l, i) => (
                  <div key={l.key} className={`grid grid-cols-[1fr_auto] gap-x-4 px-3 py-1.5 text-sm ${i % 2 ? 'bg-secondary/20' : ''}`}>
                    <span className="text-muted-foreground truncate">{l.label}</span>
                    <span className={`font-mono-nums text-right ${l.amount < 0 ? 'text-destructive' : l.amount > 0 ? 'text-success' : ''}`}>
                      {l.amount > 0 ? '+' : ''}{brl(l.amount)}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 text-sm font-semibold border-t border-border bg-secondary/40">
                  <span>Renda Líquida (cai na conta)</span>
                  <span className="font-mono-nums text-right text-success">{brl(calc.renda)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 text-sm font-semibold border-t border-border">
                  <span>Pagamento do Comprador</span>
                  <span className="font-mono-nums text-right">{brl(calc.pagamentoComprador ?? 0)}</span>
                </div>
              </div>

              {/* KPIs de lucro */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Lucro (Renda − Custo)</p>
                  <p className={`text-lg font-bold font-mono-nums ${calc.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>{brl(calc.lucro)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Margem</p>
                  <p className={`text-lg font-bold font-mono-nums ${calc.margem >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {calc.margem >= 0 ? '+' : ''}{calc.margem.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Solver reverso: preço-alvo por margem */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preço-alvo por Margem</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" value={targetMargin}
                      onChange={e => setTargetMargin(e.target.value)}
                      className="w-14 h-7 px-1.5 rounded-md bg-background border border-border text-xs font-mono-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>
                {solver === null ? (
                  <p className="text-[11px] text-muted-foreground">Informe o custo do fornecedor para calcular o preço ideal.</p>
                ) : solver.infeasible ? (
                  <p className="text-[11px] text-destructive">Taxas muito altas — não há preço viável com essa margem.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Preço sugerido</span>
                      <span className="text-sm font-bold font-mono-nums text-accent">{brl(solver.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Faixa de taxa por item</span>
                      <span className="text-xs font-mono-nums">{solver.tier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Lucro estimado</span>
                      <span className="text-xs font-mono-nums text-success">{brl(solver.lucro)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrice(solver.price.toFixed(2))}
                      className="w-full mt-1 text-[11px] py-1.5 rounded-md border border-border bg-background hover:bg-secondary/60 transition-colors"
                    >
                      Usar este preço no simulador →
                    </button>
                  </div>
                )}
              </div>

              {/* Alertas */}
              {inHighTier && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/40 text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    Você está na <b>faixa alta</b> de taxa por item ({brl(calc.itemFeeApplied)} = {pctItemShare.toFixed(0)}% do preço).
                    Dividir em 2 anúncios abaixo de {brl(80)} pode reduzir para {brl(4)} cada.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Como usar */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como precificar melhor:</p>
              <p>1. Selecione o produto ou digite o <b>custo do fornecedor</b> (aba Estoque).</p>
              <p>2. Digite o <b>preço de venda</b> que pretende cobrar.</p>
              <p>3. Ajuste as taxas se a Shopee mudar; elas são calibradas nos seus pedidos reais.</p>
              <p>4. Use os toggles PIX / Frete / AMP e o cupom para simular promoções.</p>
              <p>5. O objetivo: <b>margem positiva</b> e lucro que cubra o custo + DAS (4%).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
