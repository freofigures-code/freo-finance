import React, { useState, useEffect } from 'react';
import { useStore, Cost } from '../../store/useStore';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface RegisterCostModalProps {
  onClose: (dateSelected?: string) => void;
  costToEdit?: Cost;
}

export default function RegisterCostModal({ onClose, costToEdit }: RegisterCostModalProps) {
  const { addCost, updateCost } = useStore();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('material');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (costToEdit) {
      setDate(costToEdit.date);
      setDescription(costToEdit.description);
      setAmount(costToEdit.amount);
      setCategory(costToEdit.category);
      setIsRecurring(costToEdit.isRecurring);
      setNotes(costToEdit.notes || '');
    }
  }, [costToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    if (costToEdit) {
      updateCost(costToEdit.id, {
        date,
        description,
        amount,
        category,
        isRecurring,
        notes
      });
    } else {
      addCost({
        date,
        description,
        amount,
        category,
        isRecurring,
        notes
      });
    }
    
    onClose(date); // pass date back so it can navigate to the respective month
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-[var(--card)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-white">{costToEdit ? 'Editar Custo' : 'Registrar Novo Custo'}</h2>
          <button 
            onClick={() => onClose()}
            className="text-[var(--muted-foreground)] hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="register-cost-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Compra de Resina 5L, Facebook Ads..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                >
                  <option value="matéria-prima">Matéria-Prima</option>
                  <option value="marketing">Marketing</option>
                  <option value="energia">Energia</option>
                  <option value="embalagem">Embalagem</option>
                  <option value="software">Software / Ferramentas</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-black/20 rounded-xl border border-[var(--color-brand-border-light)] cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[var(--color-brand-gold)] focus:ring-[var(--color-brand-gold)]"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Custo Recorrente</p>
                <p className="text-[10px] text-[var(--color-brand-text-subtle)]">Marque se este for um custo pago mensalmente.</p>
              </div>
            </label>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Observações (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={2}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)] resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--border)] bg-black/20 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onClose()}>
            Cancelar
          </Button>
          <Button type="submit" form="register-cost-form">
            {costToEdit ? 'Salvar Alterações' : 'Registrar Custo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
