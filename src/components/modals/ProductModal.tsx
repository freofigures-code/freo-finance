import React, { useState, useEffect } from 'react';
import { useStore, Product, Channel } from '../../store/useStore';
import { Button } from '../ui/Button';
import { X, Calculator, Tag, Edit2 } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface ProductModalProps {
  productToEdit?: Product;
  onClose: () => void;
}

export default function ProductModal({ productToEdit, onClose }: ProductModalProps) {
  const { settings, addProduct, updateProduct } = useStore();
  const allChannels = Object.keys(settings.platforms) as Channel[];

  const [name, setName] = useState(productToEdit?.name || '');
  const [productionCost, setProductionCost] = useState(productToEdit?.productionCost || 0);
  const [indirectCost, setIndirectCost] = useState(productToEdit?.indirectCost || 0);
  const [markup, setMarkup] = useState(productToEdit?.markup || 2.0);
  const [activeChannels, setActiveChannels] = useState<Channel[]>(
    productToEdit?.activeChannels || allChannels.slice(0, 3)
  );

  const [printTimeHours, setPrintTimeHours] = useState(productToEdit?.printTimeHours || 0);
  const [printTimeMinutes, setPrintTimeMinutes] = useState(productToEdit?.printTimeMinutes || 0);
  const [weightGrams, setWeightGrams] = useState(productToEdit?.weightGrams || 0);
  const [materialType, setMaterialType] = useState(productToEdit?.materialType || 'PLA');
  const [isProductionCostManual, setIsProductionCostManual] = useState(productToEdit?.isProductionCostManual || false);

  const tempoHoras = printTimeHours + (printTimeMinutes / 60);
  const custoMaterial = (weightGrams / 1000) * (settings.defaultFilamentCostKg || 120);
  const custoEnergia = ((settings.avgPrinterWatts || 150) / 1000) * tempoHoras * (settings.energyCostKwh || 0.95);
  const custoRejeito = (custoMaterial + custoEnergia) * ((settings.defaultFailureRatePercent || 12) / 100);
  const calculatedProductionCost = custoMaterial + custoEnergia + custoRejeito;

  const finalProductionCost = isProductionCostManual ? productionCost : calculatedProductionCost;
  const totalCost = finalProductionCost + indirectCost;

  const toggleChannel = (channel: Channel) => {
    if (activeChannels.includes(channel)) {
      setActiveChannels(activeChannels.filter(c => c !== channel));
    } else {
      setActiveChannels([...activeChannels, channel]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const productData = {
      name,
      productionCost: finalProductionCost,
      indirectCost,
      markup,
      activeChannels,
      printTimeHours,
      printTimeMinutes,
      weightGrams,
      materialType,
      isProductionCostManual,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, productData);
    } else {
      addProduct(productData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-brand-border-light)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{productToEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
            <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mt-1">Precificação Inteligente Freo</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Nome do Produto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                placeholder="Ex: Busto Cody Rhodes 3D..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Tempo de Impressão</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Hrs"
                    value={printTimeHours || ''}
                    onChange={(e) => setPrintTimeHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)] text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={printTimeMinutes || ''}
                    onChange={(e) => setPrintTimeMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)] text-center"
                  />
                </div>
                <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-1.5">Tempo total na impressora.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Filamento / Resina (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weightGrams || ''}
                  onChange={(e) => setWeightGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
                <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-1.5">Gramas na peça / suportes.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Tipo de Material</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)] appearance-none"
                >
                  <option value="PLA">PLA</option>
                  <option value="PETG">PETG</option>
                  <option value="ABS">ABS</option>
                  <option value="Resina">Resina (Standard)</option>
                  <option value="Resina ABS-Like">Resina ABS-Like</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
              <div className="relative group">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Custo de Produção (R$)</label>
                  <button 
                    type="button" 
                    onClick={() => setIsProductionCostManual(!isProductionCostManual)}
                    className={cn(
                      "p-1.5 rounded-md transition-colors", 
                      isProductionCostManual ? "bg-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)]" : "text-[var(--muted-foreground)] hover:text-white"
                    )}
                    title={isProductionCostManual ? "Reverter para cálculo automático" : "Ajustar valor manualmente"}
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
                
                {isProductionCostManual ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productionCost}
                    onChange={(e) => setProductionCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-[var(--color-brand-gold)] bg-black/40 rounded-xl text-white focus:outline-none"
                  />
                ) : (
                  <div 
                    className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/60 rounded-xl text-white font-mono cursor-not-allowed flex justify-between"
                  >
                    <span>{formatCurrency(calculatedProductionCost)}</span>
                    <span className="text-xs text-[var(--color-brand-gold)] flex items-center bg-[var(--color-brand-gold)]/10 px-2 py-0.5 rounded">Auto</span>
                  </div>
                )}
                
                {!isProductionCostManual && (
                  <div className="absolute left-0 top-full mt-2 w-full p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-brand-text-subtle)]">Material:</span>
                      <span className="text-white">{formatCurrency(custoMaterial)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-brand-text-subtle)]">Energia:</span>
                      <span className="text-white">{formatCurrency(custoEnergia)}</span>
                    </div>
                    <div className="flex justify-between pb-1 mb-1 border-b border-[var(--color-brand-border-light)]">
                      <span className="text-[var(--color-brand-text-subtle)]">Rejeito ({settings.defaultFailureRatePercent || 12}%):</span>
                      <span className="text-white">{formatCurrency(custoRejeito)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[var(--color-brand-gold)]">
                      <span>Total:</span>
                      <span>{formatCurrency(calculatedProductionCost)}</span>
                    </div>
                  </div>
                )}
                {isProductionCostManual && (
                  <p className="text-[10px] text-[var(--color-brand-gold)] mt-1.5">Valor manual definido. Clique no ícone para reverter ao automático.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Custo Indireto Rateado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={indirectCost}
                  onChange={(e) => setIndirectCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
                <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-1.5">Embalagem, frete, marketing, etc.</p>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--color-brand-border-light)] rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2 text-[var(--color-brand-gold)] font-medium text-sm">
                  <Calculator size={18} />
                  Calculadora de Precificação
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Custo Total Atual</span>
                  <span className="text-xl font-bold text-white font-mono">{formatCurrency(totalCost)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] uppercase tracking-widest text-white font-medium">Markup</label>
                  <span className="text-lg font-bold text-[var(--color-brand-gold)] bg-[var(--color-brand-gold)]/10 px-3 py-1 rounded-lg">
                    {markup.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={markup}
                  onChange={(e) => setMarkup(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-brand-gold)] mt-2"
                />
                <p className="text-[10px] text-[var(--color-brand-text-subtle)] mt-2">
                  O markup multiplica o seu Custo Total para formar o valor base que cobrirá lucro e despesas variáveis.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-3 font-medium">Canais de Venda Ativos</label>
                <div className="flex flex-wrap gap-2">
                  {allChannels.map(channel => (
                    <button
                      type="button"
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={cn(
                        "px-4 py-2 text-sm rounded-lg border transition-all font-medium",
                        activeChannels.includes(channel)
                          ? "bg-[var(--color-brand-gold)]/10 border-[var(--color-brand-gold)] text-[var(--color-brand-gold)]"
                          : "bg-black/20 border-[var(--color-brand-border-light)] text-[var(--color-brand-text-subtle)] hover:border-[var(--color-brand-gold)]/50"
                      )}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {activeChannels.length > 0 && (
                <div className="space-y-3 pt-4">
                  <span className="block text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Preços Sugeridos por Plataforma</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeChannels.map(channel => {
                      const platform = settings.platforms[channel];
                      const feeDecimal = platform ? (platform.feePercent / 100) : 0;
                      
                      // preco_canal = (custo_total × markup) ÷ (1 - taxa_canal)
                      const suggestedPrice = feeDecimal < 1 
                        ? (totalCost * markup) / (1 - feeDecimal) 
                        : (totalCost * markup); // Fallback prevention if fee is 100%
                      
                      // margem_real = 1 - (custo_total / preco_canal)
                      const marginReal = suggestedPrice > 0 ? (1 - (totalCost / suggestedPrice)) * 100 : 0;

                      let marginColor = "text-[var(--color-brand-success)]";
                      let marginBg = "bg-emerald-500/10";
                      
                      if (marginReal < 30) {
                         marginColor = "text-red-400";
                         marginBg = "bg-red-500/10";
                      } else if (marginReal >= 50) {
                         marginColor = "text-emerald-400";
                         marginBg = "bg-emerald-500/10 border border-emerald-500/20";
                      } else {
                         marginColor = "text-yellow-400";
                         marginBg = "bg-yellow-500/10";
                      }

                      return (
                        <div key={channel} className="bg-black/40 border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
                           <div>
                             <div className="text-xs text-[var(--color-brand-text-subtle)] font-semibold mb-1 truncate">{channel}</div>
                             <div className="text-lg font-bold text-white font-mono">{formatCurrency(suggestedPrice)}</div>
                           </div>
                           <div className="mt-3 flex items-center justify-between">
                              <span className="text-[10px] text-[var(--muted-foreground)]">Margem Real</span>
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md", marginColor, marginBg)}>
                                {marginReal.toFixed(1)}%
                              </span>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--color-brand-border-light)] flex justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="product-form">
            {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
