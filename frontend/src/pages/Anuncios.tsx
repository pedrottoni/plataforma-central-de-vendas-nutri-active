import React, { useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useUser, useProducts, useProductVariations, useKitCompositions, useTransactions } from '@/hooks/use-data'
import { supabase } from '@/lib/supabase'
import { Package, BarChart3, DollarSign, ArrowUpDown, ChevronDown, ChevronUp, ChevronRight, Plus, Minus, TrendingUp, Percent, Receipt } from 'lucide-react'

type ProductSortKey = 'name' | 'ads' | 'sold' | 'revenue'
type StockSortKey = 'name' | 'stock' | 'cost' | 'invested'

const STOCK_SORT_OPTIONS: { key: StockSortKey; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'stock', label: 'Estoque' },
  { key: 'cost', label: 'Custo' },
  { key: 'invested', label: 'Investido' },
]

export function Anuncios() {
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const { data: products = [] } = useProducts(user?.id)
  const productIds = useMemo(() => products.map(p => p.id), [products])
  const { data: variations = [] } = useProductVariations(productIds)
  const { data: kitCompositions = [] } = useKitCompositions()
  const { data: transactions = [] } = useTransactions(user?.id)
  const kitProductIds = useMemo(() => new Set(kitCompositions.map(kc => kc.kit_product_id)), [kitCompositions])

  // Product tab state
  const [productSort, setProductSort] = useState<ProductSortKey>('name')
  const [productAsc, setProductAsc] = useState(true)
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())

  // Stock tab state
  const [stockSort, setStockSort] = useState<StockSortKey>('name')
  const [stockAsc, setStockAsc] = useState(true)
  const [stockModal, setStockModal] = useState<{ productId: number; productName: string } | null>(null)
  const [newStockValue, setNewStockValue] = useState('')

  const variationsByProduct = useMemo(() => {
    const map = new Map<number, typeof variations>()
    for (const v of variations) {
      const arr = map.get(v.product_id) ?? []
      arr.push(v)
      map.set(v.product_id, arr)
    }
    return map
  }, [variations])

  const toggleExpand = (productId: number) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const sortedProducts = useMemo(() => {
    const arr = [...products]
    switch (productSort) {
      case 'name': return arr.sort((a, b) => productAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title))
      case 'ads': return arr.sort((a, b) => {
        const av = (variationsByProduct.get(a.id) ?? []).length
        const bv = (variationsByProduct.get(b.id) ?? []).length
        return productAsc ? av - bv : bv - av
      })
      case 'sold': return arr.sort((a, b) => productAsc ? a.sold_count - b.sold_count : b.sold_count - a.sold_count)
      case 'revenue': return arr.sort((a, b) => {
        const ar = a.sold_count * (variationsByProduct.get(a.id)?.[0]?.discount_price ?? a.price)
        const br = b.sold_count * (variationsByProduct.get(b.id)?.[0]?.discount_price ?? b.price)
        return productAsc ? ar - br : br - ar
      })
    }
  }, [products, productSort, productAsc, variationsByProduct])

  const toggleProductSort = (key: ProductSortKey) => {
    if (productSort === key) setProductAsc(prev => !prev)
    else { setProductSort(key); setProductAsc(key === 'name') }
  }

  const toggleStockSort = (key: StockSortKey) => {
    if (stockSort === key) setStockAsc(prev => !prev)
    else { setStockSort(key); setStockAsc(key === 'name') }
  }

  const updateStock = useCallback(async (productId: number, delta: number, reduceInvested = false) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newStock = product.stock + delta
    if (newStock < 0) return
    const investedDelta = (delta > 0 || reduceInvested) ? delta * product.supplier_price : 0
    await supabase
      .from('products')
      .update({ stock: newStock, total_invested: product.total_invested + investedDelta })
      .eq('id', productId)
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }, [products, queryClient])

  const sortedStock = useMemo(() => {
    const arr = products.filter(p => !kitProductIds.has(p.id))
    switch (stockSort) {
      case 'name': return arr.sort((a, b) => stockAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title))
      case 'stock': return arr.sort((a, b) => stockAsc ? a.stock - b.stock : b.stock - a.stock)
      case 'cost': return arr.sort((a, b) => stockAsc ? a.supplier_price - b.supplier_price : b.supplier_price - a.supplier_price)
      case 'invested': return arr.sort((a, b) => {
        return stockAsc ? a.total_invested - b.total_invested : b.total_invested - a.total_invested
      })
    }
  }, [products, stockSort, stockAsc])

  const stockProducts = products.filter(p => !kitProductIds.has(p.id))
  const totalStock = stockProducts.reduce((s, p) => s + p.stock, 0)
  const totalInvested = stockProducts.reduce((s, p) => s + p.total_invested, 0)

  // COGS: custo real do que foi vendido
  const totalCogs = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME')
    let cogs = 0
    for (const t of income) {
      if (t.category === 'kit' && t.product_id) {
        const kitComps = kitCompositions.filter(kc => kc.kit_product_id === t.product_id)
        for (const kc of kitComps) {
          const compProduct = products.find(p => p.id === kc.component_product_id)
          if (compProduct) cogs += t.quantity * kc.quantity_per_kit * compProduct.supplier_price
        }
      } else if (t.variation_id) {
        const variation = variations.find(v => v.id === t.variation_id)
        if (variation) cogs += t.quantity * variation.supplier_price
      }
    }
    return cogs
  }, [transactions, kitCompositions, products, variations])
  const totalSold = products.reduce((s, p) => s + p.sold_count, 0)
  const totalRevenue = products.reduce((s, p) => s + p.sold_count * p.price, 0)
  const avgTicket = totalSold > 0 ? totalRevenue / totalSold : 0
  const margin = totalRevenue > 0 ? ((totalRevenue - totalInvested) / totalRevenue) * 100 : 0
  const roi = totalInvested > 0 ? ((totalRevenue - totalInvested) / totalInvested) * 100 : 0

  return (
    <div className="space-y-6">

      {/* ── KPIs ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Vendidos" value={totalSold} description="unidades vendidas" valueColor="" />
        <KpiCard icon={TrendingUp} label="ROI" value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`} description="retorno sobre investimento" valueColor="text-success" />
        <KpiCard icon={Percent} label="Margem" value={`${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`} description="lucro sobre receita" valueColor="text-purple-500" />
        <KpiCard icon={Receipt} label="Ticket Médio" value={`R$ ${avgTicket.toFixed(2)}`} description="receita por venda" valueColor="" />
        <KpiCard icon={Package} label="Anúncios" value={products.length} description="produtos ativos" valueColor="" />
        <KpiCard icon={BarChart3} label="Estoque Total" value={totalStock} description="potes em estoque" valueColor="" />
        <KpiCard icon={DollarSign} label="Investido" value={`R$ ${totalInvested.toFixed(2)}`} description="total com fornecedor" valueColor="" />
        <KpiCard icon={DollarSign} label="COGS" value={`R$ ${totalCogs.toFixed(2)}`} description="custo do que foi vendido" valueColor="" />
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos" className="text-xs">Anúncios</TabsTrigger>
          <TabsTrigger value="estoque" className="text-xs">Estoque</TabsTrigger>
          <TabsTrigger value="precificacao" className="text-xs">Precificação</TabsTrigger>
        </TabsList>

        {/* ─── Tab: Anúncios ─── */}
        <TabsContent value="produtos" className="mt-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Lista de Anúncios ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum produto cadastrado. CRUD será implementado quando o backend estiver pronto.
                </p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 text-sm items-center">
                  {/* Header */}
                  <button onClick={() => toggleProductSort('name')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Anúncios {productSort === 'name' && (productAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleProductSort('ads')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Variações {productSort === 'ads' && (productAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleProductSort('sold')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Vendidos {productSort === 'sold' && (productAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleProductSort('revenue')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Receita {productSort === 'revenue' && (productAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>

                  <div className="col-span-full border-b border-border" />

                  {/* Product Rows */}
                  {sortedProducts.map(p => {
                    const isExpanded = expandedProducts.has(p.id)
                    const pvars = variationsByProduct.get(p.id) ?? []
                    const baseVar = pvars[0]
                    const displayPrice = baseVar?.discount_price ?? p.price
                    const revenue = p.sold_count * displayPrice
                    return (
                      <React.Fragment key={p.id}>
                        <div
                          className="flex items-center gap-2.5 min-w-0 py-2.5 cursor-pointer hover:bg-secondary/30 transition-colors rounded"
                          onClick={() => toggleExpand(p.id)}
                        >
                          <div className="text-muted-foreground shrink-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono-nums">SKU: {p.sku ?? '—'}</p>
                          </div>
                        </div>
                        <p className="font-mono-nums text-left py-2.5">{pvars.length}</p>
                        <p className="font-mono-nums text-left py-2.5">{p.sold_count}</p>
                        <p className="font-semibold font-mono-nums text-left py-2.5">R$ {revenue.toFixed(2)}</p>
                        <div className="col-span-full border-b border-border" />

                        {/* Expanded: Variations */}
                        {isExpanded && pvars.length > 0 && (
                          <div className="col-span-full py-2 space-y-1">
                            {pvars.map(v => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/40 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] font-mono-nums py-2">
                                    {v.name}
                                  </Badge>
                                  <span className="text-muted-foreground font-mono-nums text-[10px]">
                                    SKU: {v.sku ?? '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">
                                    {v.sold_count} vendidos
                                  </span>
                                  <span className="font-mono-nums font-semibold">
                                    Valor de tabela: R$ {v.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}

                  {/* Total Row */}
                  <span className="text-muted-foreground font-medium pt-3 border-t border-border">Total</span>
                  <span className="pt-3 border-t border-border" />
                  <span className="font-bold font-mono-nums text-left pt-3 border-t border-border">{totalSold}</span>
                  <span className="font-bold font-mono-nums text-left pt-3 border-t border-border">R$ {totalRevenue.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Estoque ─── */}
        <TabsContent value="estoque" className="mt-4">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold shrink-0">
                  Controle de Estoque — {totalStock} potes · R$ {totalInvested.toFixed(2)}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  {STOCK_SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => toggleStockSort(opt.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        stockSort === opt.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum produto para monitorar.
                </p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 text-sm items-center">
                  {/* Header */}
                  <button onClick={() => toggleStockSort('name')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Produto {stockSort === 'name' && (stockAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleStockSort('stock')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Estoque {stockSort === 'stock' && (stockAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleStockSort('cost')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Custo {stockSort === 'cost' && (stockAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleStockSort('invested')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Investido {stockSort === 'invested' && (stockAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>

                  <div className="col-span-full border-b border-border" />

                  {/* Stock Rows */}
                  {sortedStock.map(p => (
                    <React.Fragment key={p.id}>
                      <div className="flex items-center gap-2.5 min-w-0 py-2.5">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="font-medium truncate">{p.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 py-2.5">
                        <button
                          onClick={() => { setNewStockValue(''); setStockModal({ productId: p.id, productName: p.title }) }}
                          disabled={p.stock <= 0}
                          className="h-6 w-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center disabled:opacity-30 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`font-mono-nums w-6 text-center font-bold ${p.stock <= 0 ? 'text-destructive' : p.stock <= 5 ? 'text-destructive' : p.stock <= 15 ? 'text-warning' : 'text-success'}`}>{p.stock}</span>
                        <button
                          onClick={() => updateStock(p.id, 1)}
                          className="h-6 w-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-mono-nums text-left py-2.5">R$ {p.supplier_price.toFixed(2)}</p>
                      <p className="font-semibold font-mono-nums text-left py-2.5">R$ {p.total_invested.toFixed(2)}</p>
                      <div className="col-span-full border-b border-border" />
                    </React.Fragment>
                  ))}

                  {/* Total Row */}
                  <span className="text-muted-foreground font-medium pt-3 border-t border-border">Total</span>
                  <span className="font-mono-nums text-left text-muted-foreground pt-3 border-t border-border">{totalStock} un.</span>
                  <span className="pt-3 border-t border-border" />
                  <span className="font-bold font-mono-nums text-left pt-3 border-t border-border">R$ {totalInvested.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Precificação ─── */}
        <TabsContent value="precificacao" className="mt-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Calculadora de Precificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Custo do Fornecedor (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Taxa Marketplace (%)
                  </label>
                  <input
                    type="number"
                    placeholder="12"
                    defaultValue={12}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Frete Estimado (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Calculadora será processada quando os campos forem preenchidos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Motivo da remoção */}
      <Dialog open={!!stockModal} onOpenChange={(open) => { if (!open) setStockModal(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover item do estoque</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stockModal?.productName}
            </p>
          </DialogHeader>
          {(() => {
            const modalProduct = stockModal ? products.find(p => p.id === stockModal.productId) : null
            const currentStock = modalProduct?.stock ?? 0
            const newStockNum = parseInt(newStockValue) || 0
            const isInvalid = newStockNum >= currentStock || newStockNum < 0
            return (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Novo estoque
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Atual: {currentStock}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="number"
                      value={newStockValue}
                      onChange={e => setNewStockValue(e.target.value)}
                      placeholder={String(currentStock)}
                      min="0"
                      className="h-8 w-24 rounded-md border border-border bg-background px-2 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                {isInvalid && newStockValue !== '' && (
                  <p className="text-[11px] text-destructive">
                    O novo estoque deve ser menor que o estoque atual ({currentStock}).
                  </p>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (stockModal && !isInvalid) {
                        const delta = newStockNum - currentStock
                        updateStock(stockModal.productId, delta, false)
                        setStockModal(null)
                        setNewStockValue('')
                      }
                    }}
                    disabled={isInvalid || newStockValue === ''}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium">Venda</p>
                    <p className="text-xs text-muted-foreground">Estoque diminui · Investido mantido</p>
                  </button>
                  <button
                    onClick={() => {
                      if (stockModal && !isInvalid) {
                        const delta = newStockNum - currentStock
                        updateStock(stockModal.productId, delta, true)
                        setStockModal(null)
                        setNewStockValue('')
                      }
                    }}
                    disabled={isInvalid || newStockValue === ''}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium">Remoção</p>
                    <p className="text-xs text-muted-foreground">Estoque diminui · Investido também diminui</p>
                  </button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
