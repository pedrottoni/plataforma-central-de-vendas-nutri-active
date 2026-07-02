import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface User {
  id: number
  username: string
  level: number
  xp: number
  joined_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  category: string
  priority: number
  is_completed: boolean
  auto_generated: boolean
  target_tab: string | null
  created_at: string
  completed_at: string | null
  user_id: number
}

export interface Product {
  id: number
  title: string
  description: string
  keywords: string | null
  price: number
  supplier_price: number
  stock: number
  initial_stock: number
  sku: string | null
  shopee_id: string | null
  category: string | null
  created_at: string
  user_id: number
  sold_count: number
  total_invested: number
}

export interface ProductVariation {
  id: number
  name: string
  price: number
  discount_price: number
  supplier_price: number
  stock: number
  sku: string | null
  shopee_id: string | null
  product_id: number
  created_at: string
  sold_count: number
}

export interface Transaction {
  id: number
  date: string
  type: string
  category: string
  description: string
  amount: number
  product_id: number | null
  variation_id: number | null
  quantity: number
  user_id: number
  order_id: string | null
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'Admin')
        .single()
      if (error) throw error
      return data as User
    },
  })
}

export function useTasks(userId: number | undefined) {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!userId,
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: number) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task: { title: string; description: string; category: string; priority: number; user_id: number }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          is_completed: false,
          auto_generated: false,
          target_tab: null,
          user_id: task.user_id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: number) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useProducts(userId: number | undefined) {
  return useQuery({
    queryKey: ['products', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
    enabled: !!userId,
  })
}

export function useProductVariations(productIds: number[]) {
  return useQuery({
    queryKey: ['product-variations', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return []
      const { data, error } = await supabase
        .from('productvariations')
        .select('*')
        .in('product_id', productIds)
        .order('price', { ascending: true })
      if (error) throw error
      return data as ProductVariation[]
    },
    enabled: productIds.length > 0,
  })
}

export function useTransactions(userId: number | undefined) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!userId,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tx: Omit<Transaction, 'id'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(tx)
        .select()
        .single()
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ── Helpers ──────────────────────────────────────────────

/** Extract pots count from variation name ("2 Potes" → 2, "1 Pote" → 1) */
export function extractPots(name: string): number {
  const match = name.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

// ── Kit Compositions ─────────────────────────────────────

export interface KitComposition {
  id: number
  kit_product_id: number
  component_product_id: number
  quantity_per_kit: number
}

export function useKitCompositions() {
  return useQuery({
    queryKey: ['kit-compositions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kit_compositions')
        .select('*')
      if (error) throw error
      return data as KitComposition[]
    },
  })
}

// ── Register Sale ────────────────────────────────────────

interface RegisterSaleParams {
  productId: number
  variationId: number | null
  amount: number
  quantity: number
  date: string
  userId: number
  orderId?: string | null
}

export function useRegisterSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, variationId, amount, quantity, date, userId, orderId }: RegisterSaleParams) => {
      // Fetch product first
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      if (pErr || !product) throw new Error('Produto não encontrado')

      // Check if this is a KIT product
      const { data: kitComps } = await supabase
        .from('kit_compositions')
        .select('*')
        .eq('kit_product_id', productId)

      if (kitComps && kitComps.length > 0) {
        // ── KIT SALE: deduct from component products ──
        const variationName = variationId
          ? (await supabase.from('productvariations').select('name').eq('id', variationId).single()).data?.name ?? ''
          : ''
        const potsPerUnit = extractPots(variationName)
        const totalPots = quantity * potsPerUnit

        for (const comp of kitComps) {
          const { data: compProduct, error: cpErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', comp.component_product_id)
            .single()
          if (cpErr || !compProduct) throw new Error(`Produto componente não encontrado (id=${comp.component_product_id})`)

          const potsToDeduct = quantity * comp.quantity_per_kit
          if (compProduct.stock < potsToDeduct) {
            throw new Error(`Estoque insuficiente de "${compProduct.title}". Disponível: ${compProduct.stock} potes. Necessário: ${potsToDeduct} potes.`)
          }

          const { error: upErr } = await supabase
            .from('products')
            .update({
              stock: compProduct.stock - potsToDeduct,
              sold_count: (compProduct.sold_count || 0) + quantity,
            })
            .eq('id', comp.component_product_id)
          if (upErr) throw upErr
        }

        // Create INCOME transaction for KIT
        const compNames = kitComps.map(c => `${c.quantity_per_kit}× componente`).join(', ')
        const description = `${product.title} — ${variationName} (${compNames})`
        const { data: tx, error: txErr } = await supabase
          .from('transactions')
          .insert({
            date,
            type: 'INCOME',
            category: 'kit',
            description,
            amount,
            product_id: productId,
            variation_id: variationId,
            quantity,
            user_id: userId,
            order_id: orderId || null,
          })
          .select()
          .single()
        if (txErr) throw txErr

        return { transaction: tx as Transaction, totalPots, potsPerUnit, isKit: true }
      }

      // ── NORMAL SALE: deduct from variation ──
      if (!variationId) throw new Error('Variação obrigatória para produto não-KIT')

      const { data: variation, error: vErr } = await supabase
        .from('productvariations')
        .select('*')
        .eq('id', variationId)
        .single()
      if (vErr || !variation) throw new Error('Variação não encontrada')

      const potsPerUnit = extractPots(variation.name)
      const totalPots = quantity * potsPerUnit

      if (product.stock < totalPots) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock} potes. Necessário: ${totalPots} potes.`)
      }

      const { error: pUpErr } = await supabase
        .from('products')
        .update({
          stock: product.stock - totalPots,
          sold_count: (product.sold_count || 0) + quantity,
        })
        .eq('id', productId)
      if (pUpErr) throw pUpErr

      // Also increment variation sold_count
      const { error: vUpErr } = await supabase
        .from('productvariations')
        .update({
          sold_count: (variation.sold_count || 0) + quantity,
        })
        .eq('id', variationId)
      if (vUpErr) throw vUpErr

      const description = `${product.title} — ${variation.name} (${quantity}× ${potsPerUnit} pote${potsPerUnit > 1 ? 's' : ''})`
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          date,
          type: 'INCOME',
          category: 'venda',
          description,
          amount,
          product_id: productId,
          variation_id: variationId,
          quantity,
          user_id: userId,
          order_id: orderId || null,
        })
        .select()
        .single()
      if (txErr) throw txErr

      return { transaction: tx as Transaction, totalPots, potsPerUnit, isKit: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variations'] })
    },
  })
}

// ── Delete Sale ──────────────────────────────────────────

export function useDeleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      // ── KIT SALE: category === 'kit', restore component products ──
      if (transaction.category === 'kit' && transaction.product_id) {
        const { data: kitComps } = await supabase
          .from('kit_compositions')
          .select('*')
          .eq('kit_product_id', transaction.product_id)

        if (kitComps && kitComps.length > 0) {
          for (const comp of kitComps) {
            const { data: compProduct, error: cpErr } = await supabase
              .from('products')
              .select('*')
              .eq('id', comp.component_product_id)
              .single()
            if (cpErr || !compProduct) throw new Error(`Produto componente não encontrado (id=${comp.component_product_id})`)

            const potsToRestore = transaction.quantity * comp.quantity_per_kit
            const { error: upErr } = await supabase
              .from('products')
              .update({
                stock: compProduct.stock + potsToRestore,
                sold_count: Math.max(0, (compProduct.sold_count || 0) - transaction.quantity),
              })
              .eq('id', comp.component_product_id)
            if (upErr) throw upErr
          }

          const { error: delErr } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transaction.id)
          if (delErr) throw delErr

          return { totalPots: transaction.quantity, quantity: transaction.quantity, isKit: true }
        }
      }

      // ── NORMAL SALE: has variation_id ──
      if (!transaction.variation_id) {
        throw new Error('Transação sem variação associada. Não é possível reverter estoque automaticamente.')
      }

      const { data: variation, error: vErr } = await supabase
        .from('productvariations')
        .select('*')
        .eq('id', transaction.variation_id)
        .single()
      if (vErr || !variation) throw new Error('Variação não encontrada')

      const potsPerUnit = extractPots(variation.name)
      const totalPots = transaction.quantity * potsPerUnit

      // Restore stock only at product level
      if (transaction.product_id) {
        const { data: product, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', transaction.product_id)
          .single()
        if (!pErr && product) {
          await supabase
            .from('products')
            .update({
              stock: product.stock + totalPots,
              sold_count: Math.max(0, (product.sold_count || 0) - transaction.quantity),
            })
            .eq('id', transaction.product_id)
        }
      }

      // Also restore variation sold_count
      await supabase
        .from('productvariations')
        .update({
          sold_count: Math.max(0, (variation.sold_count || 0) - transaction.quantity),
        })
        .eq('id', transaction.variation_id)

      const { error: delErr } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
      if (delErr) throw delErr

      return { totalPots, quantity: transaction.quantity, isKit: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variations'] })
    },
  })
}

// ── Batch Sale Operations ────────────────────────────────

/** Update amount/date on a single sale (no stock impact) */
export function useUpdateSaleField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }: { id: number; fields: { amount?: number; date?: string; variation_id?: number | null } }) => {
      const { error } = await supabase
        .from('transactions')
        .update(fields)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

/** Batch update amount/date on multiple sales (no stock impact) */
export function useBatchUpdateSaleField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, fields }: { ids: number[]; fields: { amount?: number; date?: string } }) => {
      const { error } = await supabase
        .from('transactions')
        .update(fields)
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

/** Batch update quantity on multiple sales (with stock adjustment) */
export function useBatchUpdateSaleQuantity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ transactions: txs, newQty }: { transactions: Transaction[]; newQty: number }) => {
      for (const tx of txs) {
        // Fetch product
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', tx.product_id)
          .single()
        if (!product) continue

        if (tx.category === 'kit' && tx.product_id) {
          // KIT: restore old, deduct new from components
          const { data: kitComps } = await supabase
            .from('kit_compositions')
            .select('*')
            .eq('kit_product_id', tx.product_id)

          if (kitComps && kitComps.length > 0) {
            for (const comp of kitComps) {
              const { data: compProduct } = await supabase
                .from('products')
                .select('*')
                .eq('id', comp.component_product_id)
                .single()
              if (!compProduct) continue
              const oldPots = tx.quantity * comp.quantity_per_kit
              const newPots = newQty * comp.quantity_per_kit
              await supabase
                .from('products')
                .update({
                  stock: compProduct.stock + oldPots - newPots,
                  sold_count: Math.max(0, (compProduct.sold_count || 0) - tx.quantity + newQty),
                })
                .eq('id', comp.component_product_id)
            }
          }
        } else if (tx.variation_id) {
          // Normal: restore old pots to product, deduct new pots
          const { data: variation } = await supabase
            .from('productvariations')
            .select('*')
            .eq('id', tx.variation_id)
            .single()
          if (variation) {
            const potsPerUnit = extractPots(variation.name)
            const oldPots = tx.quantity * potsPerUnit
            const newPots = newQty * potsPerUnit
            await supabase
              .from('products')
              .update({
                stock: product.stock + oldPots - newPots,
                sold_count: Math.max(0, (product.sold_count || 0) - tx.quantity + newQty),
              })
              .eq('id', tx.product_id)
            // Also update variation sold_count
            await supabase
              .from('productvariations')
              .update({
                sold_count: Math.max(0, (variation.sold_count || 0) - tx.quantity + newQty),
              })
              .eq('id', tx.variation_id)
          }
        }

        // Update transaction quantity
        await supabase
          .from('transactions')
          .update({ quantity: newQty })
          .eq('id', tx.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variations'] })
    },
  })
}

/** Batch delete sales with stock restoration */
export function useBatchDeleteSales() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transactions: Transaction[]) => {
      for (const tx of transactions) {
        // KIT sale: restore component products
        if (tx.category === 'kit' && tx.product_id) {
          const { data: kitComps } = await supabase
            .from('kit_compositions')
            .select('*')
            .eq('kit_product_id', tx.product_id)

          if (kitComps && kitComps.length > 0) {
            for (const comp of kitComps) {
              const { data: compProduct } = await supabase
                .from('products')
                .select('*')
                .eq('id', comp.component_product_id)
                .single()
              if (!compProduct) continue
              const potsToRestore = tx.quantity * comp.quantity_per_kit
              await supabase
                .from('products')
                .update({
                  stock: compProduct.stock + potsToRestore,
                  sold_count: Math.max(0, (compProduct.sold_count || 0) - tx.quantity),
                })
                .eq('id', comp.component_product_id)
            }
          }
        } else if (tx.variation_id && tx.product_id) {
          // Normal: restore stock
          const { data: variation } = await supabase
            .from('productvariations')
            .select('*')
            .eq('id', tx.variation_id)
            .single()
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', tx.product_id)
            .single()
          if (variation && product) {
            const potsPerUnit = extractPots(variation.name)
            const totalPots = tx.quantity * potsPerUnit
            await supabase
              .from('products')
              .update({
                stock: product.stock + totalPots,
                sold_count: Math.max(0, (product.sold_count || 0) - tx.quantity),
              })
              .eq('id', tx.product_id)
            // Also restore variation sold_count
            await supabase
              .from('productvariations')
              .update({
                sold_count: Math.max(0, (variation.sold_count || 0) - tx.quantity),
              })
              .eq('id', tx.variation_id)
          }
        }

        // Delete transaction
        await supabase
          .from('transactions')
          .delete()
          .eq('id', tx.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variations'] })
    },
  })
}

export interface InventoryItem {
  id: number
  name: string
  supplier_price: number
  stock: number
  initial_stock: number
  min_stock: number
  created_at: string
  user_id: number
}

export function useLowStockItems(userId: number | undefined) {
  return useQuery({
    queryKey: ['low-stock', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return (data as Product[]).filter(item => item.stock <= 15)
    },
    enabled: !!userId,
  })
}
