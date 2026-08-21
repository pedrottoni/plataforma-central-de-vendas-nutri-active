import React, { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { useUser, useTransactions, useProducts, useProductVariations, useRegisterSale, useDeleteSale, useKitCompositions, useBatchDeleteSales, useBatchUpdateSaleField, useBatchUpdateSaleQuantity, useUpdateSaleField, useRegisterExpense, useDeleteExpense, extractPots } from '@/hooks/use-data'
import { TrendingUp, Upload, ArrowUpRight, ArrowDownRight, Plus, ChevronUp, ChevronDown, AlertTriangle, Trash2, Check, Minus, Pencil, X, RotateCw, BarChart3, PieChart as PieChartIcon, Wallet, Receipt } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

// ── Expense categories & payment methods ──
const EXPENSE_CATEGORIES = [
  { value: 'Logística', label: 'Logística' },
  { value: 'Embalagem', label: 'Embalagem' },
  { value: 'Operação', label: 'Operação' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Comissões e Taxas', label: 'Comissões e Taxas' },
  { value: 'Impostos', label: 'Impostos' },
  { value: 'Devoluções', label: 'Devoluções' },
]

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Cartão Crédito', label: 'Cartão Crédito' },
  { value: 'Cartão Débito', label: 'Cartão Débito' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Boleto', label: 'Boleto' },
]

export function Financeiro() {
  const { data: user } = useUser()
  const { data: transactions = [] } = useTransactions(user?.id)
  const { data: products = [] } = useProducts(user?.id)
  const { data: allVariations = [] } = useProductVariations(products.map(p => p.id))
  const registerSale = useRegisterSale()
  const deleteSale = useDeleteSale()
  const registerExpense = useRegisterExpense()
  const deleteExpense = useDeleteExpense()
  const { data: kitCompositions = [] } = useKitCompositions()

  // ── Period filter ──
  const PERIOD_OPTIONS = [
    { value: 'all', label: 'Todo o período' },
    { value: 'month', label: 'Mês atual' },
    { value: 'prev_month', label: 'Mês anterior' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '15d', label: 'Últimos 15 dias' },
    { value: 'quarter', label: 'Últimos 3 meses' },
    { value: 'ytd', label: 'Ano atual (YTD)' },
  ]
  const [period, setPeriod] = useState<string | number>('all')

  // — Date helpers (local, PT-BR) —
  const startOfToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }
  const addDays = (date: Date, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }
  const startOfMonth = (offset: number) => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    d.setMonth(d.getMonth() + offset)
    return d
  }
  const startOfYear = () => {
    const d = new Date()
    d.setMonth(0, 1)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Resolve [start, end] for current period filter (inclusive end via next-day start)
  const periodRange = useMemo((): { start: Date; endExclusive: Date } => {
    const today = startOfToday()
    switch (period) {
      case 'month': return { start: startOfMonth(0), endExclusive: startOfMonth(1) }
      case 'prev_month': return { start: startOfMonth(-1), endExclusive: startOfMonth(0) }
      case '7d': return { start: addDays(today, -6), endExclusive: addDays(today, 1) }
      case '15d': return { start: addDays(today, -14), endExclusive: addDays(today, 1) }
      case 'quarter': return { start: addDays(today, -90), endExclusive: addDays(today, 1) }
      case 'ytd': return { start: startOfYear(), endExclusive: addDays(today, 1) }
      default: return { start: new Date(0), endExclusive: new Date(8640000000000000) }
    }
  }, [period])

  const txInPeriod = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date.split('T')[0] + 'T12:00:00')
      return d >= periodRange.start && d < periodRange.endExclusive
    })
  }, [transactions, periodRange])

  // — Prev period for MoM / YoY comparison —
  const prevRange = useMemo((): { start: Date; end: Date } => {
    const len = periodRange.endExclusive.getTime() - periodRange.start.getTime()
    return {
      start: new Date(periodRange.start.getTime() - len),
      end: new Date(periodRange.start.getTime()),
    }
  }, [periodRange])

  const prevTx = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date.split('T')[0] + 'T12:00:00')
      return d >= prevRange.start && d < prevRange.end
    })
  }, [transactions, prevRange])

  const income = useMemo(() => transactions.filter(t => t.type === 'INCOME'), [transactions])
    const totalInvested = products.reduce((s, p) => s + p.total_invested, 0)

    // ── Period-filtered KPIs ──
    const incomeInPeriod = useMemo(() => txInPeriod.filter(t => t.type === 'INCOME'), [txInPeriod])
    const expensesInPeriod = useMemo(() => txInPeriod.filter(t => t.type === 'EXPENSE'), [txInPeriod])
    const totalIncomeInPeriod = incomeInPeriod.reduce((s, t) => s + t.amount, 0)
    const totalExpensesInPeriod = expensesInPeriod.reduce((s, t) => s + t.amount, 0)

    // Invested do período: proporcional aos dias cobertos pelo filtro relativo ao total histórico.
    // O investido não tem data de venda → alocar proporcionalmente pela janela temporal coberta pelos dados.
    const dataSpanMs = useMemo(() => {
      if (transactions.length === 0) return 1
      let min = Infinity
      let max = -Infinity
      for (const t of transactions) {
        const ts = new Date(t.date.split('T')[0] + 'T12:00:00').getTime()
        if (ts < min) min = ts
        if (ts > max) max = ts
      }
      return Math.max(1, max - min)
    }, [transactions])

    const investedInPeriod = useMemo(() => {
      if (period === 'all' || dataSpanMs <= 0) return totalInvested
      const totalDays = Math.max(1, dataSpanMs / 86400000)
      const windowMs = periodRange.endExclusive.getTime() - periodRange.start.getTime()
      const windowDays = Math.max(0, windowMs / 86400000)
      const coverage = totalDays > 0 ? Math.min(windowDays / totalDays, 1) : 0
      return totalInvested * coverage
    }, [period, periodRange, totalInvested, dataSpanMs])

    const totalDespesasInPeriod = totalExpensesInPeriod + investedInPeriod
    const profitInPeriod = totalIncomeInPeriod - totalDespesasInPeriod
    const marginInPeriod = totalIncomeInPeriod > 0 ? ((profitInPeriod / totalIncomeInPeriod) * 100).toFixed(1) : '0.0'

    // Comparativo vs período anterior (MoM / YoY)
    const prevIncome = prevTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const prevExpenses = prevTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    const prevProfit = prevIncome - prevExpenses
    const incomeDeltaPct = prevIncome > 0 ? ((totalIncomeInPeriod - prevIncome) / prevIncome) * 100 : null
    const profitDeltaPct = prevProfit !== 0 ? ((profitInPeriod - prevProfit) / Math.abs(prevProfit)) * 100 : null

    // Ticket médio + nº transações do período
    const ticketMedio = incomeInPeriod.length > 0 ? totalIncomeInPeriod / incomeInPeriod.length : 0
    const txPlural = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural)

    // ── Fluxo de caixa (por dia se janela curta, senão por mês) ──
    const cashFlow = useMemo(() => {
      const windowDays = (periodRange.endExclusive.getTime() - periodRange.start.getTime()) / 86400000
      const byMonth = windowDays > 31
      const fmtDay = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        return `${dd}/${mm}`
      }
      const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const fmtMonth = (d: Date) => `${MONTH_ABBR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
      // chave de ordenação = data ISO; label = exibição
      const map = new Map<string, { income: number; expense: number; day: string; sortKey: string }>()
      for (const t of txInPeriod) {
        const d = new Date(t.date.split('T')[0] + 'T12:00:00')
        const key = byMonth ? t.date.slice(0, 7) : t.date.split('T')[0]
        const cur = map.get(key) ?? { income: 0, expense: 0, day: byMonth ? fmtMonth(d) : fmtDay(d), sortKey: key }
        if (t.type === 'INCOME') cur.income += t.amount
        else cur.expense += t.amount
        map.set(key, cur)
      }
      return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    }, [txInPeriod, periodRange])

    // ── Despesas por categoria (pizza) ──
    const expensesByCategory = useMemo(() => {
      const map = new Map<string, number>()
      for (const t of expensesInPeriod) {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
      }
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    }, [expensesInPeriod])

    const CHART_COLORS = {
      success: 'oklch(72% 0.16 145)',
      destructive: 'oklch(65% 0.20 25)',
      primary: 'oklch(65% 0.17 255)',
      warning: 'oklch(75% 0.16 85)',
      muted: 'oklch(30% 0.015 255)',
    }
    const PIE_COLORS = [
      'oklch(72% 0.16 145)',
      'oklch(65% 0.20 25)',
      'oklch(65% 0.17 255)',
      'oklch(75% 0.16 85)',
      'oklch(60% 0.14 310)',
      'oklch(70% 0.12 180)',
      'oklch(68% 0.13 40)',
    ]

    // ── Top produtos por faturamento ──
    const topProducts = useMemo(() => {
      const map = new Map<string, { name: string; revenue: number; qty: number }>()
      for (const t of incomeInPeriod) {
        const name = t.description.replace(/\s*\(.*\)$/, '').trim()
        const cur = map.get(name) ?? { name, revenue: 0, qty: 0 }
        cur.revenue += t.amount
        cur.qty += t.quantity
        map.set(name, cur)
      }
      return Array.from(map.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    }, [incomeInPeriod])

  // Sale form state
  interface SaleItem { productId: number | ''; variationId: number | ''; amount: string; quantity: string }
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ productId: '', variationId: '', amount: '', quantity: '1' }])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleOrderId, setSaleOrderId] = useState('')
  const [editingOrderIds, setEditingOrderIds] = useState<number[]>([]) // IDs das transações existentes deste pedido
  const [visibleSalesCount, setVisibleSalesCount] = useState(20)
  const [visibleExpensesCount, setVisibleExpensesCount] = useState(20)

  // ── Expense form state ──
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<number | ''>('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<number | ''>('')
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false)

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

  // ── Expense form handlers ──
  const handleRegisterExpense = async () => {
    if (!user?.id) return
    const amount = parseFloat(expenseAmount.replace(',', '.'))
    if (!expenseDescription.trim() || !expenseCategory || isNaN(amount) || amount <= 0) return

    await registerExpense.mutateAsync({
      date: expenseDate,
      description: expenseDescription.trim(),
      category: EXPENSE_CATEGORIES[expenseCategory].value,
      amount,
      paymentMethod: expensePaymentMethod !== '' ? PAYMENT_METHODS[expensePaymentMethod].value : null,
      isRecurring: expenseIsRecurring,
      userId: user.id,
    })

    // Reset form
    setExpenseDescription('')
    setExpenseCategory('')
    setExpenseAmount('')
    setExpensePaymentMethod('')
    setExpenseIsRecurring(false)
    setExpenseDate(new Date().toISOString().split('T')[0])
  }

  const handleDeleteExpense = async (id: number) => {
    await deleteExpense.mutateAsync(id)
  }

  const sortedIncome = useMemo(() => {
      const arr = [...incomeInPeriod]
      switch (saleSort) {
        case 'description': return arr.sort((a, b) => saleAsc ? a.description.localeCompare(b.description) : b.description.localeCompare(a.description))
        case 'quantity': return arr.sort((a, b) => saleAsc ? a.quantity - b.quantity : b.quantity - a.quantity)
        case 'date': return arr.sort((a, b) => saleAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
        case 'amount': return arr.sort((a, b) => saleAsc ? a.amount - b.amount : b.amount - a.amount)
      }
    }, [incomeInPeriod, saleSort, saleAsc])

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
        await registerSale.mutateAsync({
          productId: Number(item.productId),
          variationId: item.variationId ? Number(item.variationId) : null,
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
        const oldTx = income.find(t => t.id === existingId)
        const newQty = parseInt(item.quantity)
        const newAmount = parseFloat(item.amount)

        // Update transaction
        await supabase.from('transactions').update({
          product_id: item.productId,
          variation_id: item.variationId || null,
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
          await registerSale.mutateAsync({
            productId: Number(item.productId),
            variationId: item.variationId ? Number(item.variationId) : null,
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

    return (
        <div className="space-y-6">

          {/* ── Filtro de período (toolbar do layout já mostra o título da página) ── */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Período
            </span>
            <div className="w-44">
              <CustomSelect
                value={period}
                options={PERIOD_OPTIONS}
                onChange={val => setPeriod(val)}
              />
            </div>
          </div>

        {/* ── KPIs (respeitam o período) ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={ArrowUpRight}
            label="Receita"
            value={`R$ ${totalIncomeInPeriod.toFixed(2)}`}
            description={`${incomeInPeriod.length} venda${incomeInPeriod.length !== 1 ? 's' : ''}`}
            valueColor="text-success"
            trend={incomeDeltaPct !== null && incomeDeltaPct !== 0 ? { value: Math.abs(Math.round(incomeDeltaPct)), positive: incomeDeltaPct > 0 } : undefined}
          />
          <KpiCard
            icon={Receipt}
            label="Ticket Médio"
            value={`R$ ${ticketMedio.toFixed(2)}`}
            description={`em ${incomeInPeriod.length} transaç${txPlural(incomeInPeriod.length, 'ão', 'ões')}`}
            valueColor=""
          />
          <KpiCard
            icon={ArrowDownRight}
            label="Despesas"
            value={`R$ ${totalDespesasInPeriod.toFixed(2)}`}
            description={`${expensesInPeriod.length} transaç${txPlural(expensesInPeriod.length, 'ão', 'ões')} + R$ ${investedInPeriod.toFixed(2)} investido`}
            valueColor="text-destructive"
          />
          <KpiCard
            icon={TrendingUp}
            label="Lucro"
            value={`R$ ${profitInPeriod.toFixed(2)}`}
            description={`margem ${marginInPeriod}%`}
            valueColor={profitInPeriod >= 0 ? 'text-success' : 'text-destructive'}
            trend={profitDeltaPct !== null && profitDeltaPct !== 0 ? { value: Math.abs(Math.round(profitDeltaPct)), positive: profitDeltaPct > 0 } : undefined}
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

        <TabsContent value="dashboard" className="mt-4 space-y-4">
                  {/* ── Fluxo de Caixa (diário) ── */}
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          Fluxo de Caixa
                        </CardTitle>
                        <span className="text-xs text-muted-foreground font-mono-nums">
                          {PERIOD_OPTIONS.find(o => o.value === period)?.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {cashFlow.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">
                          Sem transações no período selecionado.
                        </p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlow} barGap={2}>
                              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} vertical={false} />
                              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'oklch(55% 0.015 250)' }} tickLine={false} axisLine={{ stroke: CHART_COLORS.muted }} />
                              <YAxis tick={{ fontSize: 11, fill: 'oklch(55% 0.015 250)' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} width={46} />
                              <Tooltip
                                contentStyle={{ background: 'oklch(19% 0.015 255)', border: '1px solid oklch(26% 0.018 255)', borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: 'oklch(90% 0.005 250)', fontWeight: 600 }}
                                formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name === 'income' ? 'Receita' : 'Despesas']}
                              />
                              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => (value === 'income' ? 'Receita' : 'Despesas')} />
                              <Bar dataKey="income" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} maxBarSize={28} />
                              <Bar dataKey="expense" fill={CHART_COLORS.destructive} radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Top Produtos + Despesas por Categoria ── */}
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {/* Top Produtos */}
                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            Top Produtos por Faturamento
                          </CardTitle>
                          <span className="text-xs text-muted-foreground font-mono-nums">top {topProducts.length}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {topProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-10">
                            Sem vendas no período selecionado.
                          </p>
                        ) : (
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: 'oklch(55% 0.015 250)' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} />
                                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'oklch(55% 0.015 250)' }} tickLine={false} axisLine={false} />
                                <Tooltip
                                  contentStyle={{ background: 'oklch(19% 0.015 255)', border: '1px solid oklch(26% 0.018 255)', borderRadius: 8, fontSize: 12 }}
                                  labelStyle={{ color: 'oklch(90% 0.005 250)', fontWeight: 600 }}
                                  formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name === 'revenue' ? 'Faturamento' : 'Quantidade']}
                                />
                                <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} maxBarSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Despesas por Categoria */}
                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                            Despesas por Categoria
                          </CardTitle>
                          <span className="text-xs text-muted-foreground font-mono-nums">R$ {totalExpensesInPeriod.toFixed(2)}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {expensesByCategory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-10">
                            Sem despesas no período selecionado.
                          </p>
                        ) : (
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={expensesByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                  {expensesByCategory.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ background: 'oklch(19% 0.015 255)', border: '1px solid oklch(26% 0.018 255)', borderRadius: 8, fontSize: 12 }}
                                  labelStyle={{ color: 'oklch(90% 0.005 250)', fontWeight: 600 }}
                                  formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
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
                  Vendas — {incomeInPeriod.length} registro{incomeInPeriod.length !== 1 ? 's' : ''}
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
              {incomeInPeriod.length > visibleSalesCount && (
                              <div className="text-center mt-3">
                                <button
                                  onClick={() => setVisibleSalesCount(prev => prev + 20)}
                                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                  title="Mostrar mais"
                  >
                    Mostrar mais ({incomeInPeriod.length - visibleSalesCount} restantes)
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="mt-4 space-y-4 overflow-visible">
          {/* ── Formulário de Despesa ── */}
          <Card className="bg-card overflow-visible">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                Registrar Despesa
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <div className="space-y-4">
                {/* Linha 1: Data + Categoria */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-end">
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Data da Despesa
                    </label>
                    <DatePicker value={expenseDate} onChange={setExpenseDate} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Categoria
                    </label>
                    <CustomSelect
                      value={expenseCategory}
                      placeholder="Selecionar categoria..."
                      options={EXPENSE_CATEGORIES.map((c, i) => ({ value: i, label: c.label }))}
                      onChange={val => setExpenseCategory(Number(val))}
                    />
                  </div>
                </div>

                {/* Linha 2: Descrição */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={e => setExpenseDescription(e.target.value)}
                    placeholder="Ex: Gasolina, Claude Pro, Meta Ads..."
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {/* Linha 3: Valor + Forma de Pagamento */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <input
                        type="text"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Forma de Pagamento
                    </label>
                    <CustomSelect
                      value={expensePaymentMethod}
                      placeholder="Opcional..."
                      options={PAYMENT_METHODS.map((m, i) => ({ value: i, label: m.label }))}
                      onChange={val => setExpensePaymentMethod(Number(val))}
                    />
                  </div>
                </div>

                {/* Linha 4: Recorrente + Botão */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setExpenseIsRecurring(!expenseIsRecurring)}
                      className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                        expenseIsRecurring
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      {expenseIsRecurring && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <RotateCw className="h-3 w-3" />
                      Despesa recorrente
                    </span>
                  </label>

                  <button
                    onClick={handleRegisterExpense}
                    disabled={
                      registerExpense.isPending ||
                      !expenseDescription.trim() ||
                      expenseCategory === '' ||
                      !expenseAmount ||
                      isNaN(parseFloat(expenseAmount.replace(',', '.')))
                    }
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {registerExpense.isPending ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Adicionar Despesa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Lista de Despesas ── */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Despesas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesInPeriod.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma despesa registrada. Use o formulário acima para adicionar.
                </p>
              ) : (
                <div className="space-y-0">
                  {expensesInPeriod.slice(0, visibleExpensesCount).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-destructive/12 flex items-center justify-center">
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium">{t.description}</p>
                            {t.is_recurring && (
                              <RotateCw className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {t.category}
                            </Badge>
                            {t.payment_method && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t.payment_method}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-mono-nums">
                              {fmtDate(t.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono-nums text-destructive">
                          -R$ {t.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(t.id)}
                          disabled={deleteExpense.isPending}
                          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {expensesInPeriod.length > visibleExpensesCount && (
                              <div className="text-center mt-3">
                                <button
                                  onClick={() => setVisibleExpensesCount(prev => prev + 20)}
                                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                  Mostrar mais ({expensesInPeriod.length - visibleExpensesCount} restantes)
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
