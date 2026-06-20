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
}

export interface Transaction {
  id: number
  date: string
  type: string
  category: string
  description: string
  amount: number
  product_id: number | null
  quantity: number
  user_id: number
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
        .from('inventoryitem')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return (data as InventoryItem[]).filter(item => item.stock < item.min_stock)
    },
    enabled: !!userId,
  })
}
