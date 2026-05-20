import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency, cn } from '../lib/utils';
import { DollarSign, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, PackageOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfMonth, isAfter, parseISO } from 'date-fns';

export default function Dashboard() {
  const { sales, withdrawals, costs } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = startOfMonth(new Date()).toISOString().split('T')[0];

  // Calculations
  const totalWithdrawals = withdrawals.reduce((acc, w) => acc + w.amount, 0);
  const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);
  const cashBalance = totalWithdrawals - totalCosts;

  const monthSales = sales.filter(s => s.date >= firstDayOfMonth && s.status !== 'cancelado');
  const monthGross = monthSales.reduce((acc, s) => acc + s.grossValue, 0);
  
  const todaySales = sales.filter(s => s.date === today && s.status !== 'cancelado');
  const todayGross = todaySales.reduce((acc, s) => acc + s.grossValue, 0);

  const monthWithdrawals = withdrawals.filter(w => w.date >= firstDayOfMonth)
                                      .reduce((acc, w) => acc + w.amount, 0);

  // A Receber (Total Vendas Líquidas pendentes - Repasses)
  // Simplificação: Total Líquido Estimado de todas as vendas não canceladas - Total Sacado
  const allTimeNetSales = sales.filter(s => s.status !== 'cancelado').reduce((acc, s) => acc + s.netValueEstimated, 0);
  const pendingReceive = Math.max(0, allTimeNetSales - totalWithdrawals);

  // Lucro Líquido Estimado no Mês
  // = Vendas Líquidas no mês - (CMV no mês) - Custos no mês
  const monthNetSales = monthSales.reduce((acc, s) => acc + s.netValueEstimated, 0);
  const monthCogs = monthSales.reduce((acc, s) => acc + (s.unitCostEstimated * s.qty), 0);
  const monthGeneralCosts = costs.filter(c => c.date >= firstDayOfMonth).reduce((acc, c) => acc + c.amount, 0);
  const monthEstimatedProfit = monthNetSales - monthCogs - monthGeneralCosts;

  // Chart Data: Vendas por Canal (Mês)
  const salesByChannel = monthSales.reduce((acc, sale) => {
    acc[sale.channel] = (acc[sale.channel] || 0) + sale.grossValue;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByChannel)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top Products
  const ptMap = monthSales.reduce((acc, s) => {
    acc[s.productId] = (acc[s.productId] || 0) + s.qty;
    return acc;
  }, {} as Record<string, number>);
  const topProductId = Object.entries(ptMap).sort((a,b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h1>
        <p className="text-zinc-400">Aqui está o pulso da sua operação comercial, controle real do seu dinheiro.</p>
      </div>

      {/* Main KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[var(--color-brand-gold)] relative overflow-hidden bg-gradient-to-br from-[var(--color-brand-card)] to-[#1a1c1a]">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[var(--color-brand-gold)]">
             <Wallet size={80} />
          </div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <CardTitle>Saldo Real em Caixa</CardTitle>
            <Wallet className="h-4 w-4 text-[var(--color-brand-gold)]" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-[var(--color-brand-gold)]">{formatCurrency(cashBalance)}</div>
            <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-2">
              Saques efetivados menos custos gerais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>A Receber das Plataformas</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(pendingReceive)}</div>
            <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-2">
              Valor líquido retido em plataformas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-brand-card)] to-[#1a1c1a]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Lucro Líquido Estimado (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-[var(--color-brand-success)]" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", monthEstimatedProfit >= 0 ? "text-[var(--color-brand-success)]" : "text-red-500")}>
              {formatCurrency(monthEstimatedProfit)}
            </div>
            <p className="text-[10px] font-medium mt-2 text-[var(--color-brand-success)]">
              Após taxas e custos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Vendas Brutas (Hoje)</CardTitle>
            <PackageOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(todayGross)}</div>
            <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-2">
              {todaySales.length} pedidos hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1">Faturamento Mês</p>
                 <h3 className="text-2xl font-bold text-white">{formatCurrency(monthGross)}</h3>
               </div>
               <div className="p-2 bg-[var(--muted)] rounded-lg border border-[var(--color-brand-border-light)]"><ArrowUpRight className="text-white" size={20} /></div>
             </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1">Total Sacado Mês</p>
                 <h3 className="text-2xl font-bold text-white">{formatCurrency(monthWithdrawals)}</h3>
               </div>
               <div className="p-2 bg-[var(--muted)] rounded-lg border border-[var(--color-brand-border-light)]"><ArrowDownRight className="text-[var(--color-brand-success)]" size={20} /></div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1">Custos Gerais Mês</p>
                 <h3 className="text-2xl font-bold text-white">{formatCurrency(monthGeneralCosts)}</h3>
               </div>
               <div className="p-2 bg-[var(--muted)] rounded-lg border border-[var(--color-brand-border-light)]"><ArrowDownRight className="text-red-400" size={20} /></div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Faturamento por Canal (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                  <XAxis type="number" stroke="#888" tickFormatter={(value) => `R$${value}`} />
                  <YAxis dataKey="name" type="category" width={100} stroke="#888" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-brand-gold)' : '#52525B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sales.slice(-4).reverse().map(sale => (
                <div key={sale.id} className="flex items-center justify-between border-b border-[var(--color-brand-border-light)] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-[var(--muted)] border border-[var(--color-brand-border-light)] rounded-xl text-white">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-none text-white uppercase tracking-wider">Venda {sale.channel}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Produto ID: {sale.productId} | Qtd: {sale.qty}</p>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-[var(--color-brand-success)]">+{formatCurrency(sale.grossValue)}</div>
                </div>
              ))}
               {withdrawals.slice(-2).reverse().map(w => (
                <div key={w.id} className="flex items-center justify-between border-b border-[var(--color-brand-border-light)] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-[var(--muted)] border border-[var(--color-brand-gold)] rounded-xl text-[var(--color-brand-gold)]">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-none text-white uppercase tracking-wider">Saque {w.channel}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Destino: {w.destination}</p>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-[var(--color-brand-gold)]">+{formatCurrency(w.amount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
