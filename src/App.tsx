import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Withdrawals from './pages/Withdrawals';
import Costs from './pages/Costs';
import Settings from './pages/Settings';

function App() {
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
          <Route path="relatorios" element={<div className="text-white p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl mt-12">Módulo de Relatórios Detalhados em construção para próxima versão. Use a "Visão Geral" enquanto isso.</div>} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
