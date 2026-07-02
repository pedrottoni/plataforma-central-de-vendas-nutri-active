import React, { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { useUser, useTransactions, useProducts, useProductVariations, useRegisterSale, useDeleteSale, useKitCompositions, useBatchDeleteSales, useBatchUpdateSaleField, useBatchUpdateSaleQuantity, useUpdateSaleField, extractPots } from '@/hooks/use-data'
import { TrendingUp, Upload, ArrowUpRight, ArrowDownRight, Plus, ChevronUp, ChevronDown, AlertTriangle, Trash2, Check, Minus, Pencil, X } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'

export function Financeiro() {
  const { data: user } = useUser()
  const { data: transactions = [] } = useTransactions(user?.id)
  const { data: products = [] } = useProducts(user?.id)
  const { data: allVariations = [] } = useProductVariations(products.map(p => p.id))
  const registerSale = useRegisterSale()
  const deleteSale = useDeleteSale()
  const { data: kitCompositions = [] } = useKitCompositions()

  const income = useMemo(() => transactions.filter(t => t.type === 'INCOME'), [transactions])
  const expenses = useMemo(() => transactions.filter(t => t.type === 'EXPENSE'), [transactions])
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpensesFromTx = expenses.reduce((s, t) => s + t.amount, 0)
  const totalInvested = products.reduce((s, p) => s + p.total_invested, 0)
  const totalDespesas = totalExpensesFromTx + totalInvested

  // COGS: custo real do que foi vendido
  const totalCogs = useMemo(() => {
    let cogs = 0
    for (const t of income) {
      if (t.category === 'kit' && t.product_id) {
        const kitComps = kitCompositions.filter(kc => kc.kit_product_id === t.product_id)
        for (const kc of kitComps) {
          const compProduct = products.find(p => p.id === kc.component_product_id)
          if (compProduct) cogs += t.quantity * kc.quantity_per_kit * compProduct.supplier_price
        }
      } else if (t.variation_id) {
        const variation = allVariations.find(v => v.id === t.variation_id)
        if (variation) cogs += t.quantity * variation.supplier_price
      }
    }
    return cogs
  }, [income, kitCompositions, products, allVariations])

  // Lucro = Receita − Investido Total − Despesas
  const profit = totalIncome - totalDespesas
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0.0'

  // Sale form state
  interface SaleItem { productId: number | ''; variationId: number | ''; amount: string; quantity: string }
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ productId: '', variationId: '', amount: '', quantity: '1' }])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleOrderId, setSaleOrderId] = useState('')
  const [editingOrderIds, setEditingOrderIds] = useState<number[]>([]) // IDs das transações existentes deste pedido
  const [visibleSalesCount, setVisibleSalesCount] = useState(20)
  const [visibleExpensesCount, setVisibleExpensesCount] = useState(20)

  // ── Batch selection state ──
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<number>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState<'value' | 'quantity' | 'date' | null>(null)
  const [bulkEditValue, setBulkEditValue] = useState('')
  const batchDeleteSales = useBatchDeleteSales()
  const batchUpdateField = useBatchUpdateSaleField()
  const batchUpdateQty = useBatchUpdateSaleQuantity()
  const updateSaleField = useUpdateSaleField()

  // When typing an order_id, check if it already exists → auto-fill for editing
  useEffect(() => {
    if (!saleOrderId.trim()) {
      setEditingOrderIds([])
      return
    }
    const existing = income.filter(t => t.order_id === saleOrderId.trim())
    if (existing.length > 0) {
      setEditingOrderIds(existing.map(t => t.id))
      // Auto-fill sale items from existing transactions
      setSaleItems(existing.map(t => ({
        productId: t.product_id || '',
        variationId: t.variation_id || '',
        amount: String(t.amount || ''),
        quantity: String(t.quantity || 1),
      })))
      if (existing[0]?.date) {
        setSaleDate(existing[0].date.split('T')[0])
      }
    } else {
      setEditingOrderIds([])
    }
  }, [saleOrderId, income])

  // ── Sort state ──
  type SaleSortKey = 'description' | 'quantity' | 'date' | 'amount'
  const [saleSort, setSaleSort] = useState<SaleSortKey>('date')
  const [saleAsc, setSaleAsc] = useState(false)

  const toggleSaleSort = (key: SaleSortKey) => {
    if (saleSort === key) setSaleAsc(prev => !prev)
    else { setSaleSort(key); setSaleAsc(key === 'description') }
  }

  // Helper: format date string → DD/MM/YYYY (handles both YYYY-MM-DD and ISO timestamps)
  const fmtDate = (d: string) => {
    const dateStr = d.split('T')[0]
    const [y, m, day] = dateStr.split('-')
    return `${day}/${m}/${y}`
  }

  const sortedIncome = useMemo(() => {
    const arr = [...income]
    switch (saleSort) {
      case 'description': return arr.sort((a, b) => saleAsc ? a.description.localeCompare(b.description) : b.description.localeCompare(a.description))
      case 'quantity': return arr.sort((a, b) => saleAsc ? a.quantity - b.quantity : b.quantity - a.quantity)
      case 'date': return arr.sort((a, b) => saleAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
      case 'amount': return arr.sort((a, b) => saleAsc ? a.amount - b.amount : b.amount - a.amount)
    }
  }, [income, saleSort, saleAsc])

  // Variation lookup: variationId → variation name + available variations per product
  const variationMap = useMemo(() => {
    const map = new Map<number, { name: string; product_id: number }>()
    for (const v of allVariations) map.set(v.id, { name: v.name, product_id: v.product_id })
    return map
  }, [allVariations])

  const variationsByProduct = useMemo(() => {
    const map = new Map<number, typeof allVariations>()
    for (const v of allVariations) {
      const arr = map.get(v.product_id) ?? []
      arr.push(v)
      map.set(v.product_id, arr)
    }
    return map
  }, [allVariations])

  // Order ID count: how many sales share each order_id
  const orderIdCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of income) {
      if (t.order_id) map.set(t.order_id, (map.get(t.order_id) ?? 0) + 1)
    }
    return map
  }, [income])

  // Helpers to update individual sale items
  const updateSaleItem = (index: number, field: keyof SaleItem, value: number | string) => {
    setSaleItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      // Reset variation when product changes
      if (field === 'productId') updated.variationId = ''
      return updated
    }))
  }

  const addSaleItem = () => {
    setSaleItems(prev => [...prev, { productId: '', variationId: '', amount: '', quantity: '1' }])
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== index))
  }

  // Per-item preview (KIT detection, stock check)
  const getItemPreview = (item: SaleItem) => {
    const product = item.productId ? products.find(p => p.id === item.productId) : null
    const variation = item.variationId ? allVariations.find(v => v.id === item.variationId) : null
    const isKit = item.productId ? kitCompositions.some(kc => kc.kit_product_id === item.productId) : false
    const kitCompsForProduct = isKit ? kitCompositions.filter(kc => kc.kit_product_id === item.productId) : []
    const qtyNum = parseInt(item.quantity) || 0
    const potsPerUnit = variation ? extractPots(variation.name) : 1
    const totalPots = qtyNum * potsPerUnit
    const costTotal = isKit
      ? kitCompsForProduct.reduce((sum, kc) => {
          const cp = products.find(p => p.id === kc.component_product_id)
          return sum + (cp?.supplier_price ?? 0) * kc.quantity_per_kit
        }, 0) * qtyNum
      : (variation ? variation.supplier_price * qtyNum : 0)
    const insufficientStock = isKit
      ? kitCompsForProduct.some(kc => {
          const cp = products.find(p => p.id === kc.component_product_id)
          return cp && totalPots > 0 && cp.stock < qtyNum * kc.quantity_per_kit
        })
      : !!(product && totalPots > 0 && product.stock < totalPots)
    return { product, variation, isKit, kitCompsForProduct, qtyNum, potsPerUnit, totalPots, costTotal, insufficientStock }
  }

  const handleCreateSale = async () => {
    if (!user) return
    const validItems = saleItems.filter(item => item.productId && item.variationId && item.amount && item.quantity)
    if (validItems.length === 0) return
    try {
      for (const item of validItems) {
        const isKit = kitCompositions.some(kc => kc.kit_product_id === item.productId)
        await registerSale.mutateAsync({
          productId: Number(item.productId),
          variationId: isKit ? null : (item.variationId ? Number(item.variationId) : null),
          amount: parseFloat(item.amount),
          quantity: parseInt(item.quantity),
          date: saleDate,
          userId: user.id,
          orderId: saleOrderId || null,
        })
      }
      setSaleItems([{ productId: '', variationId: '', amount: '', quantity: '1' }])
      setSaleOrderId('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar venda')
    }
  }

  // ── Edit existing order ──
  const isEditing = editingOrderIds.length > 0
  const handleEditSale = async () => {
    if (!user || editingOrderIds.length === 0) return
    const validItems = saleItems.filter(item => item.productId && item.variationId && item.amount && item.quantity)
    if (validItems.length === 0) return
    try {
      // Update existing transactions
      for (let i = 0; i < editingOrderIds.length; i++) {
        const existingId = editingOrderIds[i]
        const item = validItems[i]
        if (!item) {
          // Item was removed → delete the transaction
          await supabase.from('transactions').delete().eq('id', existingId)
          continue
        }
        const product = products.find(p => p.id === item.productId)
        const isKit = kitCompositions.some(kc => kc.kit_product_id === item.productId)
        const oldTx = income.find(t => t.id === existingId)
        const newQty = parseInt(item.quantity)
        const newAmount = parseFloat(item.amount)

        // Update transaction
        await supabase.from('transactions').update({
          product_id: item.productId,
          variation_id: isKit ? null : (item.variationId || null),
          amount: newAmount,
          quantity: newQty,
          date: saleDate,
          description: product?.title || '',
        }).eq('id', existingId)

        // Fix sold_count delta if quantity changed
        if (oldTx && product && newQty !== oldTx.quantity) {
          const delta = newQty - oldTx.quantity
          await supabase.from('products').update({
            sold_count: (product.sold_count || 0) + delta,
          }).eq('id', product.id)
        }
      }

      // If new items were added beyond what existed, create them
      if (validItems.length > editingOrderIds.length) {
        for (let i = editingOrderIds.length; i < validItems.length; i++) {
          const item = validItems[i]
          const isKit = kitCompositions.some(kc => kc.kit_product_id === item.productId)
          await registerSale.mutateAsync({
            productId: Number(item.productId),
            variationId: isKit ? null : (item.variationId ? Number(item.variationId) : null),
            amount: parseFloat(item.amount),
            quantity: parseInt(item.quantity),
            date: saleDate,
            userId: user.id,
            orderId: saleOrderId || null,
          })
        }
      }

      setSaleItems([{ productId: '', variationId: '', amount: '', quantity: '1' }])
      setSaleOrderId('')
      setEditingOrderIds([])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao editar pedido')
    }
  }

  const isAnyItemValid = saleItems.some(item => item.productId && item.variationId && item.amount && item.quantity && (parseInt(item.quantity) || 0) >= 1 && (parseFloat(item.amount) || 0) > 0)
  const isAnyItemInsufficient = saleItems.some(item => getItemPreview(item).insufficientStock)

  // Monthly chart data (mock for visual reference)
  const monthlyData = [
    { month: 'Jan', income: 1200, expense: 800 },
    { month: 'Fev', income: 1500, expense: 900 },
    { month: 'Mar', income: 1800, expense: 1100 },
    { month: 'Abr', income: 2100, expense: 1200 },
    { month: 'Mai', income: 1900, expense: 1000 },
    { month: 'Jun', income: totalIncome || 2400, expense: totalDespesas || 1300 },
  ]

  // ── Batch selection handlers ──
  const toggleSaleSelection = (id: number) => {
    setSelectedSaleIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllSales = () => {
    if (selectedSaleIds.size === income.length) {
      setSelectedSaleIds(new Set())
    } else {
      setSelectedSaleIds(new Set(income.map(t => t.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (!window.confirm(`Excluir ${selectedSaleIds.size} venda(s)? O estoque será restaurado.`)) return
    const txs = income.filter(t => selectedSaleIds.has(t.id))
    await batchDeleteSales.mutateAsync(txs)
    setSelectedSaleIds(new Set())
  }

  const handleBatchUpdateValue = async () => {
    const val = parseFloat(bulkEditValue)
    if (isNaN(val) || val <= 0) return
    await batchUpdateField.mutateAsync({ ids: [...selectedSaleIds], fields: { amount: val } })
    setBulkEditMode(null)
    setBulkEditValue('')
  }

  const handleBatchUpdateQuantity = async () => {
    const qty = parseInt(bulkEditValue)
    if (isNaN(qty) || qty < 1) return
    const txs = income.filter(t => selectedSaleIds.has(t.id))
    await batchUpdateQty.mutateAsync({ transactions: txs, newQty: qty })
    setBulkEditMode(null)
    setBulkEditValue('')
  }

  const handleBatchUpdateDate = async () => {
    if (!bulkEditValue) return
    await batchUpdateField.mutateAsync({ ids: [...selectedSaleIds], fields: { date: bulkEditValue } })
    setBulkEditMode(null)
    setBulkEditValue('')
  }

  const allSalesSelected = income.length > 0 && selectedSaleIds.size === income.length
  const maxMonthly = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)))

  return (
    <div className="space-y-6">

      {/* ── KPIs ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ArrowUpRight}
          label="Receita"
          value={`R$ ${totalIncome.toFixed(2)}`}
          description={`${income.length} vendas`}
          valueColor="text-success"
        />
        <KpiCard
          icon={TrendingUp}
          label="Lucro Bruto"
          value={`R$ ${(totalIncome - totalCogs).toFixed(2)}`}
          description={`receita − custo do que foi vendido`}
          valueColor={(totalIncome - totalCogs) >= 0 ? 'text-success' : 'text-destructive'}
        />
        <KpiCard
          icon={ArrowDownRight}
          label="Despesas"
          value={`R$ ${totalDespesas.toFixed(2)}`}
          description={`${expenses.length} transações + R$ ${totalInvested.toFixed(2)} investido`}
          valueColor="text-destructive"
        />
        <KpiCard
          icon={TrendingUp}
          label="Lucro"
          value={`R$ ${profit.toFixed(2)}`}
          description={`margem ${margin}%`}
          valueColor={profit >= 0 ? 'text-success' : 'text-destructive'}
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="vendas" className="text-xs">Vendas</TabsTrigger>
          <TabsTrigger value="despesas" className="text-xs">Despesas</TabsTrigger>
          <TabsTrigger value="uploads" className="text-xs">Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Visão Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-3">
                {monthlyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1" style={{ height: '160px' }}>
                      <div
                        className="w-5 rounded-t bg-success/80 hover:bg-success transition-colors"
                        style={{ height: `${(d.income / maxMonthly) * 140}px` }}
                        title={`Receita: R$ ${d.income}`}
                      />
                      <div
                        className="w-5 rounded-t bg-destructive/80 hover:bg-destructive transition-colors"
                        style={{ height: `${(d.expense / maxMonthly) * 140}px` }}
                        title={`Despesas: R$ ${d.expense}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded bg-success/80" />
                  Receita
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded bg-destructive/80" />
                  Despesas
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="mt-4 space-y-4 overflow-visible">
          {/* ── Formulário de Pedido ── */}
          <Card className="bg-card overflow-visible">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                Registrar Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <div className="space-y-4">
                {/* Linha 1: ID Pedido + Data (compartilhados) */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      ID do Pedido
                    </label>
                    <input
                      type="text"
                      value={saleOrderId}
                      onChange={e => setSaleOrderId(e.target.value)}
                      placeholder="Ex: 2605019GYXWFD7"
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Data da Venda
                    </label>
                    <DatePicker value={saleDate} onChange={setSaleDate} />
                  </div>
                </div>

                {/* ── Itens do pedido ── */}
                {saleItems.map((item, idx) => {
                  const preview = getItemPreview(item)
                  const itemVariations = item.productId ? allVariations.filter(v => v.product_id === item.productId) : []
                  const itemVariation = item.variationId ? allVariations.find(v => v.id === item.variationId) : null
                  const itemIsKit = item.productId ? kitCompositions.some(kc => kc.kit_product_id === item.productId) : false
                  const itemPotsPerUnit = itemVariation ? extractPots(itemVariation.name) : 1
                  const itemTotalPots = preview.qtyNum * itemPotsPerUnit
                  const itemCostTotal = preview.costTotal
                  const itemAmountNum = parseFloat(item.amount) || 0
                  const itemProfit = itemAmountNum - itemCostTotal

                  return (
                    <div key={idx} className="relative rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                      {/* Header do item */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Anúncio {saleItems.length > 1 ? `${idx + 1}` : ''}
                        </span>
                        {saleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSaleItem(idx)}
                            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Linha: Anúncio + Variação */}
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-5 items-end">
                        <div className="space-y-1.5 sm:col-span-3">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Anúncio
                          </label>
                          <CustomSelect
                            value={item.productId}
                            placeholder="Selecionar..."
                            options={products.sort((a, b) => a.title.localeCompare(b.title)).map(p => ({
                              value: p.id,
                              label: p.title,
                            }))}
                            onChange={val => updateSaleItem(idx, 'productId', Number(val))}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Variação
                          </label>
                          <CustomSelect
                            value={item.variationId}
                            placeholder="Selecionar..."
                            disabled={!item.productId}
                            options={itemVariations.map(v => ({
                              value: v.id,
                              label: v.name,
                              sublabel: `Tabela: R$ ${v.price.toFixed(2)}`,
                            }))}
                            onChange={val => updateSaleItem(idx, 'variationId', Number(val))}
                          />
                        </div>
                      </div>

                      {/* Linha: Valor + Quantidade */}
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Valor Recebido
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={e => updateSaleItem(idx, 'amount', e.target.value)}
                              placeholder="0,00"
                              step="0.01"
                              min="0"
                              className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Quantidade
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateSaleItem(idx, 'quantity', e.target.value)}
                              placeholder="0"
                              min="1"
                              className="w-full h-9 rounded-md border border-border bg-background pl-3 pr-12 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <div className="absolute right-0.5 top-0.5 flex flex-col h-[calc(100%-4px)]">
                              <button
                                type="button"
                                onClick={() => updateSaleItem(idx, 'quantity', String((parseInt(item.quantity) || 0) + 1))}
                                className="group flex-1 flex items-center justify-center w-6 rounded-sm transition-colors"
                              >
                                <ChevronUp className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSaleItem(idx, 'quantity', String(Math.max(1, (parseInt(item.quantity) || 0) - 1)))}
                                className="group flex-1 flex items-center justify-center w-6 rounded-sm transition-colors"
                              >
                                <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview por item */}
                      {item.productId && item.variationId && preview.qtyNum > 0 && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>
                            {preview.qtyNum} un. × {preview.potsPerUnit} Pote{preview.potsPerUnit > 1 ? 's' : ''} = <span className="font-semibold text-foreground">{itemTotalPots} pote{itemTotalPots > 1 ? 's' : ''}</span>
                          </span>
                          {itemIsKit && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Kit</span>
                          )}
                          {itemAmountNum > 0 && (
                            <span>
                              Lucro: <span className={`font-semibold font-mono-nums ${itemProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                R$ {itemProfit.toFixed(2)}
                              </span>
                            </span>
                          )}
                          {preview.insufficientStock && (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Estoque insuficiente
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Botão adicionar anúncio */}
                <button
                  type="button"
                  onClick={addSaleItem}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar anúncio
                </button>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={isEditing ? handleEditSale : handleCreateSale}
                  disabled={!isAnyItemValid || isAnyItemInsufficient || registerSale.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {registerSale.isPending ? 'Salvando...' : isEditing
                    ? `Editar Pedido${saleItems.length > 1 ? ` (${saleItems.filter(i => i.productId).length} anúncios)` : ''}`
                    : `Registrar Pedido${saleItems.length > 1 ? ` (${saleItems.filter(i => i.productId).length} anúncios)` : ''}`
                  }
                </button>
              </div>
            </CardContent>
          </Card>

          {/* ── Lista de Vendas ── */}
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold shrink-0">
                  Vendas — {income.length} registro{income.length !== 1 ? 's' : ''}
                </CardTitle>
                {/* ── Bulk action bar ── */}
                {selectedSaleIds.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono-nums">
                      {selectedSaleIds.size} selecionado{selectedSaleIds.size !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={handleBatchDelete}
                      disabled={batchDeleteSales.isPending}
                      className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors disabled:opacity-40"
                      title="Excluir selecionados"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </button>
                    <button
                      onClick={() => { setBulkEditMode(bulkEditMode === 'value' ? null : 'value'); setBulkEditValue('') }}
                      className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium border transition-colors ${
                        bulkEditMode === 'value' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-secondary border-border'
                      }`}
                      title="Alterar valor"
                    >
                      <Pencil className="h-3 w-3" />
                      Valor
                    </button>
                    <button
                      onClick={() => { setBulkEditMode(bulkEditMode === 'quantity' ? null : 'quantity'); setBulkEditValue('') }}
                      className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium border transition-colors ${
                        bulkEditMode === 'quantity' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-secondary border-border'
                      }`}
                      title="Alterar quantidade"
                    >
                      <Pencil className="h-3 w-3" />
                      Qtd
                    </button>
                    <button
                      onClick={() => { setBulkEditMode(bulkEditMode === 'date' ? null : 'date'); setBulkEditValue('') }}
                      className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium border transition-colors ${
                        bulkEditMode === 'date' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-secondary border-border'
                      }`}
                      title="Alterar data"
                    >
                      <Pencil className="h-3 w-3" />
                      Data
                    </button>
                  </div>
                )}
              </div>
              {/* ── Inline bulk edit controls ── */}
              {bulkEditMode && selectedSaleIds.size > 0 && (
                <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  {bulkEditMode === 'value' && (
                    <>
                      <label className="text-xs font-medium text-muted-foreground">Novo valor (R$):</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                        <input
                          type="number"
                          value={bulkEditValue}
                          onChange={e => setBulkEditValue(e.target.value)}
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          className="h-8 w-32 rounded-md border border-border bg-background pl-7 pr-2 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <button
                        onClick={handleBatchUpdateValue}
                        disabled={!bulkEditValue || batchUpdateField.isPending}
                        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        Aplicar
                      </button>
                    </>
                  )}
                  {bulkEditMode === 'quantity' && (
                    <>
                      <label className="text-xs font-medium text-muted-foreground">Nova quantidade:</label>
                      <input
                        type="number"
                        value={bulkEditValue}
                        onChange={e => setBulkEditValue(e.target.value)}
                        placeholder="0"
                        min="1"
                        className="h-8 w-24 rounded-md border border-border bg-background px-2 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={handleBatchUpdateQuantity}
                        disabled={!bulkEditValue || batchUpdateQty.isPending}
                        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        Aplicar
                      </button>
                    </>
                  )}
                  {bulkEditMode === 'date' && (
                    <>
                      <label className="text-xs font-medium text-muted-foreground">Nova data:</label>
                      <div className="w-48">
                        <DatePicker value={bulkEditValue} onChange={setBulkEditValue} />
                      </div>
                      <button
                        onClick={handleBatchUpdateDate}
                        disabled={!bulkEditValue || batchUpdateField.isPending}
                        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        Aplicar
                      </button>
                    </>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {income.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma venda registrada.
                </p>
              ) : (
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-6 text-sm items-center">
                  {/* Header */}
                  <button
                    onClick={toggleAllSales}
                    className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      allSalesSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : selectedSaleIds.size > 0
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                    title={allSalesSelected ? "Desmarcar todos" : "Selecionar todos"}
                  >
                    {allSalesSelected ? <Check className="h-3 w-3" /> : selectedSaleIds.size > 0 ? <Minus className="h-3 w-3" /> : null}
                  </button>
                  <button onClick={() => toggleSaleSort('description')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Anúncio {saleSort === 'description' && (saleAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <span className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Variação
                  </span>
                  <button onClick={() => toggleSaleSort('quantity')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Quantidade {saleSort === 'quantity' && (saleAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleSaleSort('date')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Data {saleSort === 'date' && (saleAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <button onClick={() => toggleSaleSort('amount')} className="pb-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-left flex items-center gap-1 hover:text-foreground transition-colors">
                    Valor {saleSort === 'amount' && (saleAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                  <span className="pb-2" />

                  <div className="col-span-full border-b border-border" />

                  {/* Rows */}
                  {sortedIncome.slice(0, visibleSalesCount).map(t => {
                    const isSelected = selectedSaleIds.has(t.id)
                    return (
                      <React.Fragment key={t.id}>
                        <button
                          onClick={() => toggleSaleSelection(t.id)}
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                        <div className="min-w-0 flex items-center gap-2.5 py-2.5">
                          <div className="h-8 w-8 rounded-lg bg-success/12 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.description.replace(/\s*\(.*\)$/, '')}</p>
                            {t.order_id && (
                              <p className="text-[10px] text-muted-foreground font-mono-nums flex items-center gap-1.5">
                                #{t.order_id}
                                {(orderIdCount.get(t.order_id) ?? 0) > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-semibold">
                                    {orderIdCount.get(t.order_id)} Vendas
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && t.product_id ? (
                          <div className="w-36">
                            <CustomSelect
                              value={t.variation_id ?? ''}
                              placeholder="Selecionar..."
                              options={(variationsByProduct.get(t.product_id) ?? []).map(v => ({
                                value: v.id,
                                label: v.name,
                              }))}
                              onChange={val => {
                                updateSaleField.mutate({ id: t.id, fields: { variation_id: Number(val) } })
                              }}
                            />
                          </div>
                        ) : (
                          <span className="font-mono-nums text-sm text-muted-foreground py-2.5 truncate max-w-[140px]">
                            {t.variation_id ? (variationMap.get(t.variation_id)?.name ?? '—') : '—'}
                          </span>
                        )}
                        <span className="font-mono-nums text-sm py-2.5">{t.quantity} un</span>
                        <span className="font-mono-nums text-sm text-muted-foreground py-2.5">
                          {fmtDate(t.date)}
                        </span>
                        <span className="text-sm font-semibold font-mono-nums text-success py-2.5">
                          +R$ {t.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir esta venda? O estoque será restaurado (+${t.quantity} un.).`)) {
                              deleteSale.mutate(t)
                            }
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir venda"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="col-span-full border-b border-border last:border-0" />
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
              {income.length > visibleSalesCount && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => setVisibleSalesCount(prev => prev + 20)}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Mostrar mais ({income.length - visibleSalesCount} restantes)
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="mt-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma despesa registrada.
                </p>
              ) : (
                <div className="space-y-0">
                  {expenses.slice(0, visibleExpensesCount).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-destructive/12 flex items-center justify-center">
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] mr-1.5">
                              {t.category}
                            </Badge>
                            <span className="font-mono-nums">
                              {fmtDate(t.date)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-mono-nums text-destructive">
                        -R$ {t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {expenses.length > visibleExpensesCount && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => setVisibleExpensesCount(prev => prev + 20)}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Mostrar mais ({expenses.length - visibleExpensesCount} restantes)
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploads" className="mt-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                Upload de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">
                  Arraste o CSV do Seller Center aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  ou clique para selecionar · Formatos: .csv, .xlsx
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Upload será processado quando o backend estiver conectado.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
