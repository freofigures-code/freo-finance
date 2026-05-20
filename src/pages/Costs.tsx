import React, { useState, useMemo } from 'react';
import { useStore, Cost } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Receipt, FolderOpen, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import RegisterCostModal from '../components/modals/RegisterCostModal';

export default function Costs() {
  const { costs, deleteCost } = useStore();
  const [selectedMonthDir, setSelectedMonthDir] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | undefined>(undefined);

  // Group costs by YYYY-MM
  const monthGroups: Record<string, Cost[]> = useMemo(() => {
    const groups: Record<string, Cost[]> = {};
    costs.forEach(cost => {
      const parts = cost.date.split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
        if (!groups[key]) groups[key] = [];
        groups[key].push(cost);
      }
    });
    
    // Sort keys descending
    const sortedGroups: Record<string, Cost[]> = {};
    Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [costs]);

  const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);

  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  const handleCloseModal = (dateSelected?: string) => {
    setIsRegistering(false);
    setEditingCost(undefined);
    if (dateSelected) {
      const parts = dateSelected.split('-');
      if (parts.length >= 2) {
        setSelectedMonthDir(`${parts[0]}-${parts[1]}`);
      }
    }
  };

  const handleDeleteCost = (id: string, description: string) => {
    if (confirm(`Tem certeza que deseja excluir o custo '${description}'?`)) {
      deleteCost(id);
    }
  };

  if (selectedMonthDir) {
    const monthCosts = monthGroups[selectedMonthDir] || [];
    const monthTotal = monthCosts.reduce((acc, c) => acc + c.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" className="px-2" onClick={() => setSelectedMonthDir(null)}>
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{getMonthName(selectedMonthDir)}</h1>
            <p className="text-[var(--muted-foreground)]">Custos registrados neste mês.</p>
          </div>
          <div className="sm:ml-auto">
             <Button onClick={() => setIsRegistering(true)}>
              <Plus size={16} className="mr-2" />
              Registrar Custo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Total do Mês</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(monthTotal)}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b border-[var(--color-brand-border-light)]">
            <CardTitle>Histórico de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-brand-border-light)] text-xs uppercase tracking-widest text-[var(--color-brand-text-subtle)]">
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium">Descrição</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-brand-border-light)]">
                  {monthCosts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => (
                    <tr key={c.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                         {formatDate(c.date)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-[var(--muted)] text-white/80 border border-[var(--border)] capitalize">
                           {c.category}
                         </span>
                         {c.isRecurring && (
                           <span className="ml-2 text-[10px] text-[var(--color-brand-gold)] font-bold bg-[var(--color-brand-gold)]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                             Recorrente
                           </span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-sm text-white">
                         {c.description}
                         <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{c.notes}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500 text-right font-mono">
                         - {formatCurrency(c.amount)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                         <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingCost(c)}>
                             <Edit2 size={14} />
                           </Button>
                           <Button variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteCost(c.id, c.description)}>
                             <Trash2 size={14} />
                           </Button>
                         </div>
                       </td>
                    </tr>
                  ))}
                  {monthCosts.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-brand-text-subtle)]">Nenhum custo neste mês.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {(isRegistering || editingCost) && <RegisterCostModal onClose={handleCloseModal} costToEdit={editingCost} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Custos Gerais</h1>
          <p className="text-[var(--muted-foreground)]">Todo gasto que não seja o custo direto de produção de uma peça vendida.</p>
        </div>
        <Button className="w-full sm:w-auto hover:bg-[var(--muted)] text-white" variant="outline" onClick={() => setIsRegistering(true)}>
          <Plus size={16} className="mr-2" />
          Registrar Custo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Total de Custos Histórico</p>
            <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalCosts)}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(monthGroups).map(([month, monthCosts]) => {
          const monthTotal = monthCosts.reduce((acc, c) => acc + c.amount, 0);
          return (
            <Card 
              key={month} 
              className="group cursor-pointer hover:border-[var(--color-brand-gold)] transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.1)]"
              onClick={() => setSelectedMonthDir(month)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--color-brand-gold)]/50 group-hover:text-[var(--color-brand-gold)] transition-colors">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h3 className="text-white font-medium capitalize">{getMonthName(month)}</h3>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-[var(--muted-foreground)]">{monthCosts.length} itens</span>
                    <span className="text-red-500 font-mono font-medium">{formatCurrency(monthTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {costs.length === 0 && (
          <div className="col-span-full p-10 border border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center bg-black/20">
            <Receipt className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-white font-medium mb-1">Nenhum custo registrado</h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-4">
              Você ainda não registrou nenhum custo geral. Clique em "Registrar Custo" para começar.
            </p>
            <Button onClick={() => setIsRegistering(true)} variant="outline">
              Registrar o primeiro custo
            </Button>
          </div>
        )}
      </div>

      {(isRegistering || editingCost) && <RegisterCostModal onClose={handleCloseModal} costToEdit={editingCost} />}
    </div>
  );
}
