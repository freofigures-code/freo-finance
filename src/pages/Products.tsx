import React, { useState } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Edit2, Trash2, Tag, Search } from 'lucide-react';
import ProductModal from '../components/modals/ProductModal';

export default function Products() {
  const { products, settings, deleteProduct } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const closeModals = () => {
    setIsAdding(false);
    setEditingProduct(undefined);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Catálogo de Produtos</h1>
          <p className="text-[var(--muted-foreground)]">Gerencie seu catálogo e entenda os custos e precificação por canal.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-[var(--muted-foreground)]" />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-brand-gold)] focus:ring-1 focus:ring-[var(--color-brand-gold)] transition-colors"
            />
          </div>
          <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
            <Plus size={16} className="mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(p => {
          const totalCost = (p.productionCost || 0) + (p.indirectCost || 0);

          return (
            <Card key={p.id} className="relative overflow-hidden group border-[var(--color-brand-border-light)] hover:border-[var(--color-brand-gold)]/50 transition-colors flex flex-col">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  className="p-2 bg-[var(--card)] border border-[var(--border)] rounded text-white/80 hover:text-white hover:border-[var(--color-brand-gold)] transition-colors" 
                  onClick={() => handleEdit(p)}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 hover:bg-red-500/20 transition-colors" 
                  onClick={() => deleteProduct(p.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <CardHeader className="pb-3 border-b border-[var(--color-brand-border-light)] bg-black/20">
                <div className="text-xs font-semibold text-[var(--color-brand-gold)] uppercase tracking-wider mb-1">
                  Custo Total: {formatCurrency(totalCost)}
                </div>
                <h3 className="text-xl font-bold leading-tight text-white mb-2">{p.name}</h3>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)] text-xs font-bold w-fit">
                  <Tag size={12} />
                  Markup {p.markup?.toFixed(1)}x
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <div className="p-4 bg-[var(--card)]">
                  <span className="block text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-3">Preço e Margem Real por Canal</span>
                  <div className="space-y-3">
                    {p.activeChannels && p.activeChannels.length > 0 ? p.activeChannels.map(channel => {
                      const platform = settings.platforms[channel];
                      const feeDecimal = platform ? (platform.feePercent / 100) : 0;
                      
                      const precoCanal = feeDecimal < 1 
                        ? (totalCost * (p.markup || 1)) / (1 - feeDecimal) 
                        : (totalCost * (p.markup || 1));
                      
                      const marginReal = precoCanal > 0 ? (1 - (totalCost / precoCanal)) * 100 : 0;
                      
                      let marginColor = "text-[var(--color-brand-success)]";
                      let marginBg = "bg-emerald-500/10";
                      let marginBorder = "border-emerald-500/20";
                      
                      if (marginReal < 30) {
                         marginColor = "text-red-400";
                         marginBg = "bg-red-500/10";
                         marginBorder = "border-red-500/20";
                      } else if (marginReal >= 50) {
                         marginColor = "text-emerald-400";
                         marginBg = "bg-emerald-500/10";
                         marginBorder = "border-emerald-500/30";
                      } else {
                         marginColor = "text-yellow-400";
                         marginBg = "bg-yellow-500/10";
                         marginBorder = "border-yellow-500/20";
                      }

                      return (
                        <div key={channel} className="flex items-center justify-between border-b border-[var(--color-brand-border-light)] pb-2 last:border-0 last:pb-0">
                          <span className="text-sm font-medium text-[var(--color-brand-text-subtle)] truncate max-w-[100px]" title={channel}>{channel}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white font-mono">{formatCurrency(precoCanal)}</span>
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", marginColor, marginBg, marginBorder, "w-12 text-center")}>
                              {marginReal.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="text-xs text-[var(--muted-foreground)]">Nenhum canal ativo definido.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 border border-dashed border-[var(--color-brand-border-light)] rounded-xl bg-[var(--card)]/30">
          <p className="text-[var(--color-brand-text-subtle)] mb-4">Nenhum produto cadastrado.</p>
          <Button onClick={() => setIsAdding(true)}>Criar meu primeiro produto</Button>
        </div>
      )}

      {products.length > 0 && filteredProducts.length === 0 && (
        <div className="text-center py-20 border border-dashed border-[var(--color-brand-border-light)] rounded-xl bg-[var(--card)]/30">
          <p className="text-[var(--color-brand-text-subtle)] mb-2">Nenhum produto encontrado para "{searchQuery}".</p>
          <Button variant="ghost" onClick={() => setSearchQuery('')}>Limpar busca</Button>
        </div>
      )}

      {(isAdding || editingProduct) && (
        <ProductModal 
          productToEdit={editingProduct} 
          onClose={closeModals} 
        />
      )}
    </div>
  );
}
