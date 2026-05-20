import React, { useState, useEffect } from 'react';
import { useStore, Withdrawal, Channel } from '../../store/useStore';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface RegisterWithdrawalModalProps {
  onClose: (dateSelected?: string) => void;
  withdrawalToEdit?: Withdrawal;
}

export default function RegisterWithdrawalModal({ onClose, withdrawalToEdit }: RegisterWithdrawalModalProps) {
  const { addWithdrawal, updateWithdrawal, settings } = useStore();
  const channels = Object.keys(settings.platforms) as Channel[];
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState<Channel>(channels[0] || 'Shopee');
  const [amount, setAmount] = useState<number>(0);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (withdrawalToEdit) {
      setDate(withdrawalToEdit.date);
      setChannel(withdrawalToEdit.channel);
      setAmount(withdrawalToEdit.amount);
      setDestination(withdrawalToEdit.destination);
      setNotes(withdrawalToEdit.notes || '');
    }
  }, [withdrawalToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !destination) return;
    
    if (withdrawalToEdit) {
      updateWithdrawal(withdrawalToEdit.id, {
        date,
        channel,
        amount,
        destination,
        notes
      });
    } else {
      addWithdrawal({
        date,
        channel,
        amount,
        destination,
        notes
      });
    }
    
    onClose(date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-[var(--card)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-white">{withdrawalToEdit ? 'Editar Saque' : 'Registrar Saque'}</h2>
          <button 
            type="button"
            onClick={() => onClose()}
            className="text-[var(--muted-foreground)] hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="register-withdrawal-form" onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Plataforma</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
              >
                {channels.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Valor Sacado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Conta Destino</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco Inter..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1 font-medium">Observações (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes sobre o saque..."
                rows={2}
                className="w-full px-4 py-3 border border-[var(--color-brand-border-light)] bg-black/40 rounded-xl text-white focus:outline-none focus:border-[var(--color-brand-gold)] resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--border)] bg-black/20 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onClose()}>
            Cancelar
          </Button>
          <Button type="submit" form="register-withdrawal-form">
            {withdrawalToEdit ? 'Salvar Alterações' : 'Registrar Saque'}
          </Button>
        </div>
      </div>
    </div>
  );
}
