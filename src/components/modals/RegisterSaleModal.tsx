import React, { useState, useEffect } from 'react';
import { useStore, Channel, Product } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, Calculator } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface RegisterSaleModalProps {
  onClose: () => void;
}

export default function RegisterSaleModal({ onClose }: RegisterSaleModalProps) {
  const { products, settings, addSale } = useStore();
  const channels = Object.keys(settings.platforms) as Channel[];

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState<Channel>(channels[0] || 'Shopee');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);

  // Manual Overrides
  const [manualPlatformFee, setManualPlatformFee] = useState<number | ''>('');
  const [manualShippingCost, setManualShippingCost] = useState<number | ''>('');
  const [status, setStatus] = useState<'vendido' | 'enviado' | 'concluído' | 'cancelado'>('vendido');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  // Derive preco_canal based on the selected channel
  let derivedPrice = 0;
  if (selectedProduct) {
    const totalCost = (selectedProduct.productionCost || 0) + (selectedProduct.indirectCost || 0);
    const platform = settings.platforms[channel];
    const feeDecimal = platform ? (platform.feePercent / 100) : 0;
    
    derivedPrice = feeDecimal < 1 
      ? (totalCost * (selectedProduct.markup || 1)) / (1 - feeDecimal) 
      : (totalCost * (selectedProduct.markup || 1));
  }

  // Auto-calculated values
  const grossValue = selectedProduct ? (derivedPrice * qty) - discount : 0;
  
  const platformConfig = settings.platforms[channel];
  
  // Suggested Fees based on Settings
  const suggestedPlatformFee = grossValue * (platformConfig?.feePercent / 100 || 0) + ((platformConfig?.fixedFee || 0) * qty);
  const suggestedShipping = platformConfig?.shippingCost || 0;

  // Actual Values used in calculation
  const platformFee = manualPlatformFee !== '' ? manualPlatformFee : suggestedPlatformFee;
  const shippingCost = manualShippingCost !== '' ? manualShippingCost : suggestedShipping;

  const expectedPayout = grossValue - platformFee - shippingCost;

  const unitCostRaw = selectedProduct 
    ? ((selectedProduct.productionCost || 0) + (selectedProduct.indirectCost || 0)) 
    : 0;

  const totalCost = unitCostRaw * qty;
  const estimatedProfit = expectedPayout - totalCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    addSale({
      date,
      channel,
      productId,
      qty,
      grossValue,
      discount,
      platformFee,
      shippingCost,
      unitCostEstimated: unitCostRaw,
      netValueEstimated: estimatedProfit,
      status,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-brand-border-light)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Registrar Entrada (Venda)</h2>
            <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mt-1">Calculadora de Repasse Automatizada</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="register-sale" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Canal de Venda</label>
                <select
                  required
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                >
                  {channels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Produto</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                >
                  <option value="" disabled>Selecione um Produto...</option>
                  {products.map(p => {
                    let pPrice = 0;
                    const cCost = (p.productionCost || 0) + (p.indirectCost || 0);
                    const plat = settings.platforms[channel];
                    const _fee = plat ? (plat.feePercent / 100) : 0;
                    pPrice = _fee < 1 ? (cCost * (p.markup || 1)) / (1 - _fee) : (cCost * (p.markup || 1));
                    
                    return (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(pPrice)})</option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Desconto Aplicado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>
            </div>

            {selectedProduct && (
              <div className="p-4 border border-[var(--color-brand-gold)]/20 bg-[var(--color-brand-gold)]/5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 mb-2 text-[var(--color-brand-gold)] font-medium">
                  <Calculator size={16} />
                  Calculadora da Plataforma ({channel})
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[11px] text-[var(--color-brand-text-subtle)] mb-1">
                       Taxa Cobrada ({platformConfig.feePercent}% + R${platformConfig.fixedFee})
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       placeholder={suggestedPlatformFee.toFixed(2)}
                       value={manualPlatformFee}
                       onChange={(e) => setManualPlatformFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                       className="w-full px-3 py-2 border border-dashed border-[var(--color-brand-border-light)] bg-[var(--background)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                     />
                     <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Deixe vazio para usar Padrão.</p>
                  </div>
                  <div>
                     <label className="block text-[11px] text-[var(--color-brand-text-subtle)] mb-1">Custo Frete do Vendedor (R$)</label>
                     <input
                       type="number"
                       step="0.01"
                       placeholder={suggestedShipping.toFixed(2)}
                       value={manualShippingCost}
                       onChange={(e) => setManualShippingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                       className="w-full px-3 py-2 border border-dashed border-[var(--color-brand-border-light)] bg-[var(--background)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                     />
                     <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Deixe vazio para usar Padrão.</p>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mt-2 grid grid-cols-2 gap-4 divide-x divide-[var(--color-brand-border-light)]">
                   <div>
                     <span className="block text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Valor Venda (Bruto)</span>
                     <span className="text-xl text-white font-mono">{formatCurrency(grossValue)}</span>
                   </div>
                   <div className="pl-4">
                     <span className="block text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Repasse Esperado (Bruto sem Taxas)</span>
                     <span className="text-xl text-white font-mono">{formatCurrency(expectedPayout)}</span>
                   </div>
                </div>
                 <div className="bg-[#1a1c1a] border border-[var(--color-brand-success)]/20 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] uppercase text-[var(--color-brand-success)] mb-1 font-bold">Líquido de Produção (Lucro real estimado)</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">Repasse (R$ {expectedPayout.toFixed(2)}) - CMV Total (R$ {totalCost.toFixed(2)})</span>
                    </div>
                    <span className="text-2xl text-[var(--color-brand-success)] font-bold">{formatCurrency(estimatedProfit)}</span>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Status da Venda</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                >
                  <option value="vendido">Vendido (Processando)</option>
                  <option value="enviado">Enviado</option>
                  <option value="concluído">Concluído (Entregue)</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Anotações / Cupom</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                  placeholder="Opcional..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--color-brand-border-light)] flex justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="register-sale">Confirmar Venda</Button>
        </div>
      </div>
    </div>
  );
}
