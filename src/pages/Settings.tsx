import React, { useState, useEffect } from 'react';
import { useStore, Channel } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Upload, Plus, X, Loader2, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user) {
          console.error("Usuário não autenticado.");
          setFormData(settings); // fallback to local settings
          setIsLoading(false);
          return;
        }

        const userId = userData.user.id;

        // Load Configuracoes
        const { data: configData, error: configError } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (configError && configError.code !== 'PGRST116') {
          console.error('Error fetching configuracoes:', configError);
        }

        // Load Canais
        const { data: canaisData, error: canaisError } = await supabase
          .from('canais_venda')
          .select('*')
          .eq('user_id', userId);

        if (canaisError) {
          console.error('Error fetching canais_venda:', canaisError);
        }

        let newSettings = { ...settings };

        if (configData) {
          newSettings.energyCostKwh = configData.custo_kwh;
          newSettings.wearCostHour = configData.desgaste_impressora_hora;
          newSettings.defaultTaxPercent = configData.percentual_imposto;
          newSettings.defaultFilamentCostKg = configData.preco_kg_material;
          newSettings.avgPrinterWatts = configData.consumo_impressora_watts;
          newSettings.defaultFailureRatePercent = configData.taxa_falha_rejeito;
        }

        if (canaisData && canaisData.length > 0) {
          const platforms: Record<string, any> = {};
          canaisData.forEach((canal: any) => {
            if (canal.ativo !== false) {
              platforms[canal.nome] = {
                feePercent: canal.taxa_comissao,
                fixedFee: canal.tarifa_fixa,
                shippingCost: canal.frete
              };
            }
          });
          newSettings.platforms = platforms;
        }

        setFormData(newSettings);
        updateSettings(newSettings); // also update local store to keep in sync

      } catch (err) {
        console.error("Unexpected error loading data", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [settings, updateSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus('syncing');
    setIsSaved(false);
    setIsError(false);
    
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        throw new Error('Usuário não autenticado para salvar no Supabase');
      }

      const userId = userData.user.id;

      // Upsert Configuracoes
      const configPayload = {
        user_id: userId,
        custo_kwh: formData.energyCostKwh,
        desgaste_impressora_hora: formData.wearCostHour,
        percentual_imposto: formData.defaultTaxPercent,
        preco_kg_material: formData.defaultFilamentCostKg,
        consumo_impressora_watts: formData.avgPrinterWatts,
        taxa_falha_rejeito: formData.defaultFailureRatePercent
      };

      const { error: configError } = await supabase
        .from('configuracoes')
        .upsert(configPayload, { onConflict: 'user_id' });

      if (configError) throw configError;

      // Upsert Canais de Venda
      // We assume if a channel exists it is active. Since user might have 
      // added or updated them, we will sync the keys present in formData.platforms
      const channels = Object.keys(formData.platforms);
      const canaisPayload = channels.map(channel => ({
        // We'll generate an ID based on user_id + channel name, or just let Supabase handle if it's based on it
        // Or if 'nome' and 'user_id' form a unique constraint, but typically 'id' is a UUID.
        // Assuming there isn't a known string ID constraint, we will lookup first or let Supabase insert based on user_id and nome.
        // The instructions say "UPSERT com onConflict: 'id'", but we don't track 'id' locally. We will track 'canal_id' or simply upsert by 'user_id,nome' if that unique constraint exists.
        // For now, let's try a simple insert or update if we fetch current ones.
        // A better approach is fetching existing ones to get their IDs. We'll do an upsert ignoring ID if possible, or mapping over name.
      }));

      // Let's actually fetch the existing channels to get their IDs for UPSERT, or just rely on 'user_id, nome' unique constraint.
      // Wait, let's keep it simple. If we don't have the ID, we'll try to find it.
      const { data: existingCanais } = await supabase
        .from('canais_venda')
        .select('id, nome')
        .eq('user_id', userId);

      const canaisDataToUpsert = channels.map(channel => {
        const existing = existingCanais?.find(c => c.nome === channel);
        return {
          id: existing?.id, // undefined means it will let DB generate UUID if it's an insert
          user_id: userId,
          nome: channel,
          ativo: true,
          cor: '', // you can add default colors if you want
          taxa_comissao: formData.platforms[channel].feePercent,
          tarifa_fixa: formData.platforms[channel].fixedFee,
          frete: formData.platforms[channel].shippingCost
        };
      });

      // Remove undefined ids so it doesn't try to insert null ID where it's generated
      const cleanCanaisUpsert = canaisDataToUpsert.map(c => {
         if(!c.id) delete c.id;
         return c;
      });

      for (const canal of cleanCanaisUpsert) {
         // Because UPSERT on multiple with varying existence might be tricky if we don't have the ID, 
         // we do an upsert or match by name, but instructions say onConflict: 'id'.
         if(canal.id) {
           const { error: err } = await supabase.from('canais_venda').upsert(canal, { onConflict: 'id' });
           if (err) throw err;
         } else {
           // Insert new
           const { error: err } = await supabase.from('canais_venda').insert(canal);
           if (err) throw err;
         }
      }

      // Sync successful
      updateSettings(formData);
      setSyncStatus('synced');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setTimeout(() => setSyncStatus('idle'), 3000);

    } catch (err) {
      console.error(err);
      setIsError(true);
      setSyncStatus('error');
    }
  };

  const channels = Object.keys(formData.platforms || {}) as Channel[];

  if (!formData.platforms) return null;

  const platformStyles: Record<string, { wrapper: string, title: string, inputFocus: string, iconColor?: string }> = {
    'Shopee': {
      wrapper: 'bg-gradient-to-br from-[#EE4D2D]/10 to-transparent border-[#EE4D2D]/30 shadow-[0_0_20px_rgba(238,77,45,0.08)]',
      title: 'text-[#EE4D2D] font-black text-xl uppercase tracking-wider',
      iconColor: 'text-[#EE4D2D]',
      inputFocus: 'focus:ring-[#EE4D2D] focus:border-[#EE4D2D]',
    },
    'Mercado Livre': {
      wrapper: 'bg-gradient-to-br from-[#FFE600]/10 to-transparent border-[#FFE600]/30 shadow-[0_0_20px_rgba(255,230,0,0.08)]',
      title: 'text-[#FFE600] font-black text-xl uppercase tracking-wider',
      iconColor: 'text-[#FFE600]',
      inputFocus: 'focus:ring-[#FFE600] focus:border-[#FFE600]',
    },
    'TikTok Shop': {
      wrapper: 'bg-[#050505] border-zinc-800 border-t-[#00f2fe]/60 border-b-[#fe0979]/60 shadow-[0_0_30px_rgba(254,9,121,0.08)] relative overflow-hidden',
      title: 'text-white font-black text-xl tracking-widest relative z-10',
      iconColor: 'text-[#fe0979]',
      inputFocus: 'focus:ring-[#fe0979] focus:border-[#00f2fe]',
    },
    'Site Próprio': {
      wrapper: 'bg-gradient-to-b from-[var(--color-brand-card)] to-[var(--color-brand-sidebar)] border-[var(--color-brand-gold)]/50 shadow-[0_0_20px_var(--color-brand-gold-glow)]',
      title: 'text-[var(--color-brand-gold)] font-bold text-xl font-serif tracking-widest uppercase',
      iconColor: 'text-[var(--color-brand-gold)]',
      inputFocus: 'focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)]',
    },
    'Rua': {
      wrapper: 'bg-gradient-to-br from-indigo-900/20 to-zinc-900 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.08)]',
      title: 'text-indigo-400 font-black text-xl uppercase tracking-widest',
      iconColor: 'text-indigo-400',
      inputFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, channel: Channel) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`O recurso de importação de planilhas de vendas para a plataforma ${channel} está em desenvolvimento. Arquivo reconhecido: ${file.name}`);
    }
    e.target.value = ''; // Reset for re-selection
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim()) return;
    const name = newChannelName.trim();
    if (formData.platforms[name]) {
      alert('Esta plataforma já existe.');
      return;
    }
    
    setFormData({
      ...formData,
      platforms: {
        ...formData.platforms,
        [name]: { feePercent: 0, fixedFee: 0, shippingCost: 0 }
      }
    });
    setNewChannelName('');
    setIsAddingChannel(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Configurações Base</h1>
            {syncStatus === 'syncing' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sincronizando...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sincronizado
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Erro de Sincronia
              </span>
            )}
          </div>
          <p className="text-[var(--muted-foreground)]">Estes valores afetam o cálculo automático de custo e repasse dos produtos vendidos.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-brand-gold)]" />
          <p>Carregando configurações do Supabase...</p>
        </div>
      ) : (
        <>
          <form className="space-y-8" onSubmit={handleSubmit}>
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Custos de Operação (Impressão 3D)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Custo Médio de Energia (kWh) R$</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.energyCostKwh}
                  onChange={(e) => setFormData({ ...formData, energyCostKwh: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Sua conta de luz dividida pelos kWh consumidos da casa/ateliê.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Desgaste da Impressora / Hora (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.wearCostHour}
                  onChange={(e) => setFormData({ ...formData, wearCostHour: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Fundo de reserva para trocar peças (Ex: R$ 0,50 a R$ 1,50/h).</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Percentual Padrão de Imposto (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={formData.defaultTaxPercent}
                  onChange={(e) => setFormData({ ...formData, defaultTaxPercent: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Exemplo: MEI = 0%, Simples Nacional varia (ex: 6%).</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Preço do Kg do Material (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.defaultFilamentCostKg || 120}
                  onChange={(e) => setFormData({ ...formData, defaultFilamentCostKg: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Valor médio que você paga no kg de filamento ou resina.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Consumo Médio da Impressora (Watts)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formData.avgPrinterWatts || 150}
                  onChange={(e) => setFormData({ ...formData, avgPrinterWatts: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Média: FDM 150W-300W, Resina 30W-60W.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium">Taxa de Falha/Rejeito (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formData.defaultFailureRatePercent || 12}
                  onChange={(e) => setFormData({ ...formData, defaultFailureRatePercent: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--card)] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] transition-colors"
                />
                <p className="text-[11px] text-[var(--color-brand-text-subtle)] mt-1.5">Margem padrão adicionada ao custo (Ex: 12%).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <h3 className="text-xl font-bold tracking-tight text-white mb-6">Taxas e Frete por Plataforma</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channels.map((channel) => {
              const style = platformStyles[channel] || {
                wrapper: 'bg-[var(--card)] border-[var(--color-brand-border-light)]',
                title: 'text-white',
                iconColor: 'text-white',
                inputFocus: 'focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)]'
              };
              
              const supportsImport = ['Shopee', 'TikTok Shop', 'Mercado Livre'].includes(channel);
              
              return (
                <div key={channel} className={cn("rounded-3xl p-6 border transition-all", style.wrapper)}>
                  {channel === 'TikTok Shop' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#fe0979] rounded-full blur-[80px] opacity-[0.25] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  )}
                  {channel === 'TikTok Shop' && (
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00f2fe] rounded-full blur-[80px] opacity-[0.25] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  )}
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h4 className={cn("", style.title)}>{channel}</h4>
                    
                    {supportsImport && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alert(`A conexão de conta para ${channel} está em desenvolvimento.`)}
                          className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-brand-border-light)] bg-black/40 hover:bg-black/60 transition-colors"
                        >
                          <Link size={14} className={cn("transition-colors", style.iconColor)} />
                          <span className="text-xs font-semibold text-[var(--color-brand-text-subtle)] group-hover:text-white transition-colors">Conectar conta</span>
                        </button>
                        <label className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-brand-border-light)] bg-black/40 hover:bg-black/60 transition-colors">
                          <Upload size={14} className={cn("transition-colors", style.iconColor)} />
                          <span className="text-xs font-semibold text-[var(--color-brand-text-subtle)] group-hover:text-white transition-colors">Importar XLS/CSV</span>
                          <input 
                            type="file" 
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, channel)} 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-5 relative z-10">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1.5">Taxa de Comissão (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.platforms[channel].feePercent}
                        onChange={(e) => setFormData({
                          ...formData,
                          platforms: {
                            ...formData.platforms,
                            [channel]: { ...formData.platforms[channel], feePercent: parseFloat(e.target.value) || 0 }
                          }
                        })}
                        className={cn("block w-full px-4 py-2.5 text-sm border border-[var(--color-brand-border-light)] bg-black/60 rounded-xl text-white focus:outline-none focus:ring-1 transition-all", style.inputFocus)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1.5">Tarifa Fixa (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.platforms[channel].fixedFee}
                          onChange={(e) => setFormData({
                            ...formData,
                            platforms: {
                              ...formData.platforms,
                              [channel]: { ...formData.platforms[channel], fixedFee: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className={cn("block w-full px-4 py-2.5 text-sm border border-[var(--color-brand-border-light)] bg-black/60 rounded-xl text-white focus:outline-none focus:ring-1 transition-all", style.inputFocus)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-medium mb-1.5">Frete (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.platforms[channel].shippingCost}
                          onChange={(e) => setFormData({
                            ...formData,
                            platforms: {
                              ...formData.platforms,
                              [channel]: { ...formData.platforms[channel], shippingCost: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className={cn("block w-full px-4 py-2.5 text-sm border border-[var(--color-brand-border-light)] bg-black/60 rounded-xl text-white focus:outline-none focus:ring-1 transition-all", style.inputFocus)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAddingChannel ? (
              <div className="rounded-3xl p-6 border border-dashed border-[var(--color-brand-border-light)] bg-[var(--card)]/50 flex flex-col justify-center gap-4">
                <h4 className="text-white font-medium">Nova Plataforma</h4>
                <input
                  type="text"
                  placeholder="Nome do Canal (ex: WhatsApp, Nuvemshop)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChannel(); } }}
                  className="w-full px-4 py-2.5 text-sm border border-[var(--color-brand-border-light)] bg-black/60 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingChannel(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleAddChannel} className="flex-1 border border-[var(--color-brand-gold)]/50">
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingChannel(true)}
                className="rounded-3xl p-6 border-2 border-dashed border-[var(--color-brand-border-light)] bg-[var(--card)]/30 hover:bg-[var(--card)] hover:border-[var(--color-brand-gold)]/50 text-[var(--color-brand-text-subtle)] hover:text-[var(--color-brand-gold)] transition-all flex flex-col items-center justify-center gap-4 min-h-[280px]"
              >
                <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center bg-black/20">
                  <Plus size={24} />
                </div>
                <span className="font-semibold uppercase tracking-widest text-sm">Adicionar Novo Canal</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 max-w-4xl pt-4">
          <Button type="submit" className="px-8 h-12 text-base">Salvar Todas Alterações</Button>
          {isSaved && <span className="text-[var(--color-brand-success)] text-sm font-medium">Configurações salvas com sucesso!</span>}
        </div>
      </form>
      
      <div className="p-5 max-w-4xl bg-[var(--color-brand-gold)]/5 border border-[var(--color-brand-gold)]/20 rounded-2xl">
        <h4 className="text-[var(--color-brand-gold)] font-bold tracking-wide mb-2 text-sm uppercase">Importante sobre Taxas:</h4>
        <p className="text-[var(--color-brand-text-subtle)] text-sm leading-relaxed">
          Sempre que você criar uma <strong>Venda</strong>, o sistema usará a configuração da plataforma escolhida para deduzir automaticamente as taxas (Valor Bruto {'->'} Taxas {'->'} Frete {'->'} Valor Líquido/Repasse Esperado). Você pode editar esses valores diretamente na venda se ela fugir do padrão.
        </p>
      </div>
      </>
      )}
    </div>
  );
}
