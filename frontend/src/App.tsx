import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Resumo } from '@/pages/Resumo'
import { Financeiro } from '@/pages/Financeiro'
import { Marketing } from '@/pages/Marketing'
import { Atendimento } from '@/pages/Atendimento'
import { Anuncios } from '@/pages/Anuncios'
import { Concorrencia } from '@/pages/Concorrencia'
import { Tarefas } from '@/pages/Tarefas'
import { Configuracoes } from '@/pages/Configuracoes'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/resumo" replace />} />
            <Route path="/resumo" element={<Resumo />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/atendimento" element={<Atendimento />} />
            <Route path="/anuncios" element={<Anuncios />} />
            <Route path="/concorrencia" element={<Concorrencia />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
