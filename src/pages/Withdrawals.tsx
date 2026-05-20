import React, { useState, useMemo } from 'react';
import { useStore, Channel, Withdrawal } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Wallet, ArrowRightLeft, Search, Edit2, Trash2, FolderOpen, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import RegisterWithdrawalModal from '../components/modals/RegisterWithdrawalModal';

export default function Withdrawals() {
  const { withdrawals, sales, settings, deleteWithdrawal } = useStore();

  const channels: Channel[] = Object.keys(settings.platforms);

  const [isRegistering, setIsRegistering] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<Withdrawal | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthDir, setSelectedMonthDir] = useState<string | null>(null);

  // Group withdrawals by YYYY-MM
  const monthGroups: Record<string, Withdrawal[]> = useMemo(() => {
    const groups: Record<string, Withdrawal[]> = {};
    withdrawals.forEach(w => {
      const parts = w.date.split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
        if (!groups[key]) groups[key] = [];
        groups[key].push(w);
      }
    });
    
    // Sort keys descending
    const sortedGroups: Record<string, Withdrawal[]> = {};
    Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [withdrawals]);

  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  // Calculate stats per channel
  const stats = channels.map(ch => {
    const channelSales = sales.filter(s => s.channel === ch && s.status !== 'cancelado');
    const totalEstimatedNet = channelSales.reduce((acc, s) => acc + s.netValueEstimated, 0);
    const totalWithdrawn = withdrawals.filter(w => w.channel === ch).reduce((acc, w) => acc + w.amount, 0);
    
    // Simplification for MVP: Pending = Net Sales - Withdrawn
    const pending = Math.max(0, totalEstimatedNet - totalWithdrawn);
    
    return {
      channel: ch,
      totalSold: totalEstimatedNet,
      totalWithdrawn,
      pending
    }
  });

  const filteredWithdrawals = withdrawals.filter(w => 
    w.channel.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (w.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseModal = (dateSelected?: string) => {
    setIsRegistering(false);
    setEditingWithdrawal(undefined);
    if (dateSelected) {
      const parts = dateSelected.split('-');
      if (parts.length >= 2) {
        setSelectedMonthDir(`${parts[0]}-${parts[1]}`);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este saque?')) {
      deleteWithdrawal(id);
    }
  };

  if (selectedMonthDir) {
    const monthWithdrawals = monthGroups[selectedMonthDir] || [];
    const filteredMonthWithdrawals = monthWithdrawals.filter(w => 
      w.channel.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (w.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const monthTotal = monthWithdrawals.reduce((acc, w) => acc + w.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" className="px-2" onClick={() => setSelectedMonthDir(null)}>
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{getMonthName(selectedMonthDir)}</h1>
            <p className="text-[var(--muted-foreground)]">Saques realizados neste mês.</p>
          </div>
          <div className="sm:ml-auto flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-[var(--muted-foreground)]" />
              </div>
              <input
                type="text"
                placeholder="Buscar nesta pasta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-brand-gold)] focus:ring-1 focus:ring-[var(--color-brand-gold)] transition-colors"
              />
            </div>
            <Button onClick={() => setIsRegistering(true)} className="w-full sm:w-auto">
              <Plus size={16} className="mr-2" />
              Registrar Saque
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Total de Saques (Mês)</p>
              <h3 className="text-2xl font-bold text-[var(--color-brand-gold)] mt-1">{formatCurrency(monthTotal)}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b border-[var(--color-brand-border-light)]">
            <CardTitle>Histórico de Repasses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-brand-border-light)] text-xs uppercase tracking-widest text-[var(--color-brand-text-subtle)]">
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium">Plataforma</th>
                    <th className="px-6 py-4 font-medium">Conta Destino</th>
                    <th className="px-6 py-4 font-medium">Observações</th>
                    <th className="px-6 py-4 font-medium text-right">Valor Sacado</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-brand-border-light)]">
                  {filteredMonthWithdrawals.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
                    <tr key={w.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {formatDate(w.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-[var(--muted)] text-white/80 border border-[var(--border)]">
                          {w.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                        {w.destination}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                        {w.notes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-brand-gold)] text-right">
                        + {formatCurrency(w.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingWithdrawal(w)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(w.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {monthWithdrawals.length > 0 && filteredMonthWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-brand-text-subtle)]">Nenhum repasse encontrado para "{searchQuery}".</td>
                    </tr>
                  )}
                  {monthWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-brand-text-subtle)]">Nenhum saque neste mês.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {(isRegistering || editingWithdrawal) && <RegisterWithdrawalModal onClose={handleCloseModal} withdrawalToEdit={editingWithdrawal} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Repasses (Saques)</h1>
          <p className="text-[var(--muted-foreground)]">Dinheiro real que entrou na conta. Venda é vaidade, caixa é realidade.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-[var(--muted-foreground)]" />
            </div>
            <input
              type="text"
              placeholder="Buscar saques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-brand-gold)] focus:ring-1 focus:ring-[var(--color-brand-gold)] transition-colors"
            />
          </div>
          <Button onClick={() => setIsRegistering(true)} className="w-full sm:w-auto">
            <Plus size={16} className="mr-2" />
            Registrar Saque
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
         {stats.map(stat => (
           <Card key={stat.channel} className="bg-[var(--card)] border-[var(--border)]">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm text-[var(--muted-foreground)] font-medium">{stat.channel}</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-xl font-bold text-white mb-2">{formatCurrency(stat.pending)} <span className="text-xs text-[var(--color-brand-text-subtle)] font-normal">A receber</span></div>
               <div className="w-full bg-[var(--muted)] h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="bg-[var(--color-brand-gold)] h-full" 
                   style={{ 
                     width: stat.totalSold > 0 ? `${(stat.totalWithdrawn / stat.totalSold) * 100}%` : '0%' 
                   }} 
                 />
               </div>
               <div className="flex justify-between text-xs mt-2 text-[var(--color-brand-text-subtle)]">
                 <span>Sacado: {formatCurrency(stat.totalWithdrawn)}</span>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {searchQuery ? (
        <Card>
          <CardHeader className="border-b border-[var(--color-brand-border-light)]">
            <CardTitle>Resultados da Busca</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-brand-border-light)] text-xs uppercase tracking-widest text-[var(--color-brand-text-subtle)]">
                    <th className="px-6 py-4 font-medium">Data</th>
                    <th className="px-6 py-4 font-medium">Plataforma</th>
                    <th className="px-6 py-4 font-medium">Conta Destino</th>
                    <th className="px-6 py-4 font-medium">Observações</th>
                    <th className="px-6 py-4 font-medium text-right">Valor Sacado</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-brand-border-light)]">
                  {filteredWithdrawals.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
                    <tr key={w.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {formatDate(w.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-[var(--muted)] text-white/80 border border-[var(--border)]">
                          {w.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                        {w.destination}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                        {w.notes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-brand-gold)] text-right">
                        + {formatCurrency(w.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingWithdrawal(w)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(w.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-brand-text-subtle)]">Nenhum repasse encontrado para "{searchQuery}".</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(monthGroups).map(([month, monthWithdrawals]) => {
            const monthTotal = monthWithdrawals.reduce((acc, w) => acc + w.amount, 0);
            return (
              <Card 
                key={month} 
                className="group cursor-pointer hover:border-[var(--color-brand-gold)] transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.1)] bg-[var(--card)] border-[var(--border)]"
                onClick={() => setSelectedMonthDir(month)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--color-brand-gold)]/50 group-hover:text-[var(--color-brand-gold)] transition-colors">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium capitalize">{getMonthName(month)}</h3>
                    <div className="flex gap-2 text-xs mt-1">
                      <span className="text-[var(--muted-foreground)]">{monthWithdrawals.length} itens</span>
                      <span className="text-[var(--color-brand-gold)] font-mono font-medium">+{formatCurrency(monthTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {withdrawals.length === 0 && (
            <div className="col-span-full p-10 border border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center bg-black/20">
              <Wallet className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
              <h3 className="text-white font-medium mb-1">Nenhum repasse registrado</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-4">
                Você ainda não registrou nenhum saque (repasse). Clique em "Registrar Saque" para começar.
              </p>
              <Button onClick={() => setIsRegistering(true)} variant="outline">
                Registrar o primeiro repasse
              </Button>
            </div>
          )}
        </div>
      )}
      
      {(isRegistering || editingWithdrawal) && <RegisterWithdrawalModal onClose={handleCloseModal} withdrawalToEdit={editingWithdrawal} />}
    </div>
  );
}
