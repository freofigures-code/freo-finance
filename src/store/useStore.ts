import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient'; // ajuste o caminho se necessário

export type Channel = string;
export type SaleStatus = 'vendido' | 'enviado' | 'concluído' | 'cancelado';

export interface PlatformConfig {
  feePercent: number;
  fixedFee: number;
  shippingCost: number;
}

export interface Settings {
  energyCostKwh: number;
  wearCostHour: number;
  defaultTaxPercent: number;
  defaultFilamentCostKg: number;
  avgPrinterWatts: number;
  defaultFailureRatePercent: number;
  platforms: Record<Channel, PlatformConfig>;
}

export interface Product {
  id: string;
  name: string;
  productionCost: number;
  indirectCost: number;
  markup: number;
  activeChannels: Channel[];
  printTimeHours?: number;
  printTimeMinutes?: number;
  weightGrams?: number;
  materialType?: string;
  isProductionCostManual?: boolean;
  category?: string;
  description?: string;
  defaultPrice?: number;
  filamentCostKg?: number;
  packagingCost?: number;
  taxPercent?: number;
}

export interface Sale {
  id: string;
  date: string;
  channel: Channel;
  productId: string;
  qty: number;
  grossValue: number;
  discount: number;
  platformFee: number;
  shippingCost: number;
  unitCostEstimated: number;
  netValueEstimated: number;
  status: SaleStatus;
  notes: string;
}

export interface Withdrawal {
  id: string;
  date: string;
  channel: Channel;
  amount: number;
  destination: string;
  notes: string;
}

export interface Cost {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  notes: string;
}

// ─── helpers de conversão camelCase ↔ snake_case ───────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 9);

// USER_ID fixo enquanto não há auth real — troque por auth.uid() depois
const USER_ID = 'default_user';

// Settings
const settingsToDb = (s: Settings) => ({
  user_id: USER_ID,
  energy_cost_kwh: s.energyCostKwh,
  wear_cost_hour: s.wearCostHour,
  default_tax_percent: s.defaultTaxPercent,
  default_filament_cost_kg: s.defaultFilamentCostKg,
  avg_printer_watts: s.avgPrinterWatts,
  default_failure_rate_percent: s.defaultFailureRatePercent,
  platforms: s.platforms,
});

const settingsFromDb = (row: Record<string, unknown>): Settings => ({
  energyCostKwh: Number(row.energy_cost_kwh),
  wearCostHour: Number(row.wear_cost_hour),
  defaultTaxPercent: Number(row.default_tax_percent),
  defaultFilamentCostKg: Number(row.default_filament_cost_kg),
  avgPrinterWatts: Number(row.avg_printer_watts),
  defaultFailureRatePercent: Number(row.default_failure_rate_percent),
  platforms: row.platforms as Record<Channel, PlatformConfig>,
});

// Product
const productToDb = (p: Omit<Product, 'id'> & { id?: string }) => ({
  id: p.id ?? generateId(),
  user_id: USER_ID,
  name: p.name,
  production_cost: p.productionCost,
  indirect_cost: p.indirectCost,
  markup: p.markup,
  active_channels: p.activeChannels,
  print_time_hours: p.printTimeHours ?? null,
  print_time_minutes: p.printTimeMinutes ?? null,
  weight_grams: p.weightGrams ?? null,
  material_type: p.materialType ?? null,
  is_production_cost_manual: p.isProductionCostManual ?? false,
  category: p.category ?? null,
  description: p.description ?? null,
  default_price: p.defaultPrice ?? null,
  filament_cost_kg: p.filamentCostKg ?? null,
  packaging_cost: p.packagingCost ?? null,
  tax_percent: p.taxPercent ?? null,
});

const productFromDb = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  name: row.name as string,
  productionCost: Number(row.production_cost),
  indirectCost: Number(row.indirect_cost),
  markup: Number(row.markup),
  activeChannels: (row.active_channels as string[]) ?? [],
  printTimeHours: row.print_time_hours != null ? Number(row.print_time_hours) : undefined,
  printTimeMinutes: row.print_time_minutes != null ? Number(row.print_time_minutes) : undefined,
  weightGrams: row.weight_grams != null ? Number(row.weight_grams) : undefined,
  materialType: row.material_type as string | undefined,
  isProductionCostManual: Boolean(row.is_production_cost_manual),
  category: row.category as string | undefined,
  description: row.description as string | undefined,
  defaultPrice: row.default_price != null ? Number(row.default_price) : undefined,
  filamentCostKg: row.filament_cost_kg != null ? Number(row.filament_cost_kg) : undefined,
  packagingCost: row.packaging_cost != null ? Number(row.packaging_cost) : undefined,
  taxPercent: row.tax_percent != null ? Number(row.tax_percent) : undefined,
});

// Sale
const saleToDb = (s: Omit<Sale, 'id'> & { id?: string }) => ({
  id: s.id ?? generateId(),
  user_id: USER_ID,
  date: s.date,
  channel: s.channel,
  product_id: s.productId || null,
  qty: s.qty,
  gross_value: s.grossValue,
  discount: s.discount,
  platform_fee: s.platformFee,
  shipping_cost: s.shippingCost,
  unit_cost_estimated: s.unitCostEstimated,
  net_value_estimated: s.netValueEstimated,
  status: s.status,
  notes: s.notes,
});

const saleFromDb = (row: Record<string, unknown>): Sale => ({
  id: row.id as string,
  date: row.date as string,
  channel: row.channel as string,
  productId: (row.product_id as string) ?? '',
  qty: Number(row.qty),
  grossValue: Number(row.gross_value),
  discount: Number(row.discount),
  platformFee: Number(row.platform_fee),
  shippingCost: Number(row.shipping_cost),
  unitCostEstimated: Number(row.unit_cost_estimated),
  netValueEstimated: Number(row.net_value_estimated),
  status: row.status as SaleStatus,
  notes: (row.notes as string) ?? '',
});

// Withdrawal
const withdrawalToDb = (w: Omit<Withdrawal, 'id'> & { id?: string }) => ({
  id: w.id ?? generateId(),
  user_id: USER_ID,
  date: w.date,
  channel: w.channel,
  amount: w.amount,
  destination: w.destination,
  notes: w.notes,
});

const withdrawalFromDb = (row: Record<string, unknown>): Withdrawal => ({
  id: row.id as string,
  date: row.date as string,
  channel: row.channel as string,
  amount: Number(row.amount),
  destination: (row.destination as string) ?? '',
  notes: (row.notes as string) ?? '',
});

// Cost
const costToDb = (c: Omit<Cost, 'id'> & { id?: string }) => ({
  id: c.id ?? generateId(),
  user_id: USER_ID,
  date: c.date,
  category: c.category,
  description: c.description,
  amount: c.amount,
  is_recurring: c.isRecurring,
  notes: c.notes,
});

const costFromDb = (row: Record<string, unknown>): Cost => ({
  id: row.id as string,
  date: row.date as string,
  category: row.category as string,
  description: row.description as string,
  amount: Number(row.amount),
  isRecurring: Boolean(row.is_recurring),
  notes: (row.notes as string) ?? '',
});

// ─── DEFAULT SETTINGS ──────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  energyCostKwh: 0.95,
  wearCostHour: 0.50,
  defaultTaxPercent: 6,
  defaultFilamentCostKg: 120,
  avgPrinterWatts: 150,
  defaultFailureRatePercent: 12,
  platforms: {
    'Shopee': { feePercent: 20, fixedFee: 4, shippingCost: 0 },
    'TikTok Shop': { feePercent: 12, fixedFee: 0, shippingCost: 0 },
    'Mercado Livre': { feePercent: 18, fixedFee: 6.5, shippingCost: 0 },
    'Site Próprio': { feePercent: 4.99, fixedFee: 0.39, shippingCost: 0 },
    'Rua': { feePercent: 0, fixedFee: 0, shippingCost: 0 },
  },
};

// ─── STORE ─────────────────────────────────────────────────────────────────

interface AppState {
  settings: Settings;
  products: Product[];
  sales: Sale[];
  withdrawals: Withdrawal[];
  costs: Cost[];
  loading: boolean;

  loadAll: () => Promise<void>;

  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addWithdrawal: (withdrawal: Omit<Withdrawal, 'id'>) => Promise<void>;
  updateWithdrawal: (id: string, withdrawal: Partial<Withdrawal>) => Promise<void>;
  deleteWithdrawal: (id: string) => Promise<void>;

  addCost: (cost: Omit<Cost, 'id'>) => Promise<void>;
  updateCost: (id: string, cost: Partial<Cost>) => Promise<void>;
  deleteCost: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  products: [],
  sales: [],
  withdrawals: [],
  costs: [],
  loading: false,

  // ── Carrega tudo do banco na inicialização ──
  loadAll: async () => {
    set({ loading: true });
    try {
      const [settingsRes, productsRes, salesRes, withdrawalsRes, costsRes] = await Promise.all([
        supabase.from('settings').select('*').eq('user_id', USER_ID).single(),
        supabase.from('products').select('*').eq('user_id', USER_ID).order('created_at'),
        supabase.from('sales').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
        supabase.from('costs').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
      ]);

      set({
        settings: settingsRes.data ? settingsFromDb(settingsRes.data) : DEFAULT_SETTINGS,
        products: (productsRes.data ?? []).map(productFromDb),
        sales: (salesRes.data ?? []).map(saleFromDb),
        withdrawals: (withdrawalsRes.data ?? []).map(withdrawalFromDb),
        costs: (costsRes.data ?? []).map(costFromDb),
      });
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    } finally {
      set({ loading: false });
    }
  },

  // ── Settings ──
  updateSettings: async (newSettings) => {
    const merged = { ...get().settings, ...newSettings };
    set({ settings: merged });
    await supabase
      .from('settings')
      .upsert(settingsToDb(merged), { onConflict: 'user_id' });
  },

  // ── Products ──
  addProduct: async (product) => {
    const row = productToDb(product);
    set((state) => ({ products: [...state.products, productFromDb(row)] }));
    await supabase.from('products').insert(row);
  },

  updateProduct: async (id, updated) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
    const current = get().products.find((p) => p.id === id);
    if (current) {
      const row = productToDb({ ...current, ...updated, id });
      await supabase.from('products').update(row).eq('id', id);
    }
  },

  deleteProduct: async (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    await supabase.from('products').delete().eq('id', id);
  },

  // ── Sales ──
  addSale: async (sale) => {
    const row = saleToDb(sale);
    set((state) => ({ sales: [saleFromDb(row), ...state.sales] }));
    await supabase.from('sales').insert(row);
  },

  updateSale: async (id, updated) => {
    set((state) => ({
      sales: state.sales.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    }));
    const current = get().sales.find((s) => s.id === id);
    if (current) {
      const row = saleToDb({ ...current, ...updated, id });
      await supabase.from('sales').update(row).eq('id', id);
    }
  },

  deleteSale: async (id) => {
    set((state) => ({ sales: state.sales.filter((s) => s.id !== id) }));
    await supabase.from('sales').delete().eq('id', id);
  },

  // ── Withdrawals ──
  addWithdrawal: async (withdrawal) => {
    const row = withdrawalToDb(withdrawal);
    set((state) => ({ withdrawals: [withdrawalFromDb(row), ...state.withdrawals] }));
    await supabase.from('withdrawals').insert(row);
  },

  updateWithdrawal: async (id, updated) => {
    set((state) => ({
      withdrawals: state.withdrawals.map((w) => (w.id === id ? { ...w, ...updated } : w)),
    }));
    const current = get().withdrawals.find((w) => w.id === id);
    if (current) {
      const row = withdrawalToDb({ ...current, ...updated, id });
      await supabase.from('withdrawals').update(row).eq('id', id);
    }
  },

  deleteWithdrawal: async (id) => {
    set((state) => ({ withdrawals: state.withdrawals.filter((w) => w.id !== id) }));
    await supabase.from('withdrawals').delete().eq('id', id);
  },

  // ── Costs ──
  addCost: async (cost) => {
    const row = costToDb(cost);
    set((state) => ({ costs: [costFromDb(row), ...state.costs] }));
    await supabase.from('costs').insert(row);
  },

  updateCost: async (id, updated) => {
    set((state) => ({
      costs: state.costs.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
    const current = get().costs.find((c) => c.id === id);
    if (current) {
      const row = costToDb({ ...current, ...updated, id });
      await supabase.from('costs').update(row).eq('id', id);
    }
  },

  deleteCost: async (id) => {
    set((state) => ({ costs: state.costs.filter((c) => c.id !== id) }));
    await supabase.from('costs').delete().eq('id', id);
  },
}));
