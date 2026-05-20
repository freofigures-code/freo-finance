import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Withdrawals from './pages/Withdrawals';
import Costs from './pages/Costs';
import Settings from './pages/Settings';
import { useStore } from './store/useStore';

function App() {
  const loadAll = useStore((s) => s.loadAll);
  const loading = useStore((s) => s.loading);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-yellow-500 rounded-full animate-spin" />
          <span className="text-zinc-400 text-sm">Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="entradas" element={<Sales />} />
          <Route path="repasses" element={<Withdrawals />} />
          <Route path="produtos" element={<Products />} />
          <Route path="custos" element={<Costs />} />
          <Route path="relatorios" element={
            <div className="text-white p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl mt-12">
              Módulo de Relatórios Detalhados em construção para próxima versão. Use a "Visão Geral" enquanto isso.
            </div>
          } />
          <Route path="configuracoes" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
