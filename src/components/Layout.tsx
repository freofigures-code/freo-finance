import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Package, 
  Receipt, 
  Settings, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Visão Geral' },
  { to: '/entradas', icon: TrendingUp, label: 'Entradas' },
  { to: '/repasses', icon: Wallet, label: 'Repasses' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/custos', icon: Receipt, label: 'Custos Geriais' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-brand-sidebar)] border-r border-[var(--border)] transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-[0_0_15px_var(--color-brand-gold-glow)] text-[var(--color-brand-black)] font-bold text-xl">
              F
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">FREO <span className="text-[var(--primary)]">FIGURES</span></h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#666] mt-1 ml-11">Premium 3D Studio</p>
          <button className="md:hidden absolute top-8 right-6 text-zinc-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-sm transition-all duration-200",
                isActive 
                  ? "bg-[var(--muted)] text-[var(--primary)] border-[var(--color-brand-border-light)] font-semibold" 
                  : "text-[var(--muted-foreground)] hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("transition-colors")} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <button className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-xl hover:text-white hover:bg-[var(--muted)] transition-colors">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Mobile */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-[var(--border)] bg-[var(--color-brand-header)] md:hidden">
          <button className="text-[var(--muted-foreground)]" onClick={() => setIsMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="font-bold text-white tracking-widest text-sm">FREO FIGURES</span>
          <div className="w-6" /> {/* spacer */}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 border-b border-[var(--border)] items-center justify-between px-8 bg-[var(--color-brand-header)]">
          <div>
            <h2 className="text-lg font-medium text-white">Painel de Controle Financeiro</h2>
            <p className="text-xs text-[var(--color-brand-text-subtle)]">Bem-vindo. Seus números estão sólidos hoje.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[var(--card)] border border-[var(--color-brand-border-light)] px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-success)] animate-pulse"></div>
              <span className="text-xs text-white">Sincronizado</span>
            </div>
            {/* The existing pages will render their own "Novo" buttons, so keeping header clean as per instructions to strictly styling. */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
