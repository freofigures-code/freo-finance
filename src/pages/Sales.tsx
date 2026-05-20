import { useState } from 'react';
import { useStore, Channel } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import RegisterSaleModal from '../components/modals/RegisterSaleModal';

export default function Sales() {
  const { sales, products, settings } = useStore();
  const [filterActive, setFilterActive] = useState<Channel | 'All'>('All');
  const [isRegistering, setIsRegistering] = useState(false);

  const filteredSales = filterActive === 'All' 
    ? sales 
    : sales.filter(s => s.channel === filterActive);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Desconhecido';

  const channels: (Channel | 'All')[] = ['All', ...Object.keys(settings.platforms)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Entradas (Vendas)</h1>
          <p className="text-[var(--muted-foreground)]">Registre cada peça vendida e saiba exatamente quanto vai receber limpo.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsRegistering(true)}>
          <Plus size={16} className="mr-2" />
          Registrar Venda
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0 border-b border-[var(--color-brand-border-light)] pb-4">
          <CardTitle>Histórico de Vendas</CardTitle>
          <div className="flex bg-[var(--card)] border border-[var(--color-brand-border-light)] rounded-lg p-1 overflow-x-auto w-full sm:w-auto">
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterActive(ch)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                  filterActive === ch 
                    ? "bg-[var(--muted)] text-white shadow-sm" 
                    : "text-[var(--color-brand-text-subtle)] hover:text-white/80"
                )}
              >
                {ch === 'All' ? 'Todos os Canais' : ch}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-brand-border-light)] text-xs uppercase tracking-widest text-[var(--color-brand-text-subtle)]">
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Canal</th>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium text-right">Valor Bruto</th>
                  <th className="px-6 py-4 font-medium text-right">Taxas+Frete</th>
                  <th className="px-6 py-4 font-medium text-right bg-emerald-500/5 text-[var(--color-brand-success)] rounded-tl-lg">Líquido Est.</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-brand-border-light)]">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-[var(--muted)] text-white/80 border border-[var(--border)]">
                        {sale.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      <div className="font-medium">{getProductName(sale.productId)}</div>
                      <div className="text-[var(--color-brand-text-subtle)] text-xs mt-0.5">Qtd: {sale.qty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white text-right">
                      {formatCurrency(sale.grossValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400 text-right">
                      - {formatCurrency((sale.platformFee || 0) + (sale.shippingCost || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-brand-success)] text-right bg-emerald-500/5">
                      {formatCurrency(sale.netValueEstimated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold",
                        {
                          'bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] border border-[var(--color-brand-gold)]/20': sale.status === 'vendido',
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20': sale.status === 'enviado',
                          'bg-[var(--color-brand-success)]/10 text-[var(--color-brand-success)] border border-[var(--color-brand-success)]/20': sale.status === 'concluído',
                          'bg-red-500/10 text-red-500 border border-red-500/20': sale.status === 'cancelado',
                        }
                      )}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="p-8 text-center text-[var(--color-brand-text-subtle)] text-sm">
                Nenhuma venda encontrada para o filtro selecionado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isRegistering && (
        <RegisterSaleModal onClose={() => setIsRegistering(false)} />
      )}
    </div>
  );
}
