import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AppState {
  settings: Settings;
  products: Product[];
  sales: Sale[];
  withdrawals: Withdrawal[];
  costs: Cost[];

  updateSettings: (settings: Partial<Settings>) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  addWithdrawal: (withdrawal: Omit<Withdrawal, 'id'>) => void;
  updateWithdrawal: (id: string, withdrawal: Partial<Withdrawal>) => void;
  deleteWithdrawal: (id: string) => void;

  addCost: (cost: Omit<Cost, 'id'>) => void;
  updateCost: (id: string, cost: Partial<Cost>) => void;
  deleteCost: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      products: [],
      sales: [],
      withdrawals: [],
      costs: [],

      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      addProduct: (product) =>
        set((state) => ({ products: [...state.products, { ...product, id: generateId() }] })),
      updateProduct: (id, updated) =>
        set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)) })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      addSale: (sale) =>
        set((state) => ({ sales: [...state.sales, { ...sale, id: generateId() }] })),
      updateSale: (id, updated) =>
        set((state) => ({ sales: state.sales.map((s) => (s.id === id ? { ...s, ...updated } : s)) })),
      deleteSale: (id) =>
        set((state) => ({ sales: state.sales.filter((s) => s.id !== id) })),

      addWithdrawal: (withdrawal) =>
        set((state) => ({ withdrawals: [...state.withdrawals, { ...withdrawal, id: generateId() }] })),
      updateWithdrawal: (id, updated) =>
        set((state) => ({ withdrawals: state.withdrawals.map((w) => (w.id === id ? { ...w, ...updated } : w)) })),
      deleteWithdrawal: (id) =>
        set((state) => ({ withdrawals: state.withdrawals.filter((w) => w.id !== id) })),

      addCost: (cost) =>
        set((state) => ({ costs: [...state.costs, { ...cost, id: generateId() }] })),
      updateCost: (id, updated) =>
        set((state) => ({ costs: state.costs.map((c) => (c.id === id ? { ...c, ...updated } : c)) })),
      deleteCost: (id) =>
        set((state) => ({ costs: state.costs.filter((c) => c.id !== id) })),
    }),
    {
      name: 'freo-figures-storage',
    }
  )
);
