import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Channel = string; // Changed from fixed union to 'string' to support custom platforms
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
  productionCost: number; // Custo de produção direto
  indirectCost: number;   // Custo indireto rateado
  markup: number;         // ex: 1.0 a 5.0
  activeChannels: Channel[];
  
  // Campos
  printTimeHours?: number;
  printTimeMinutes?: number;
  weightGrams?: number;
  materialType?: string;
  isProductionCostManual?: boolean;

  // Campos legados mantidos opcionais para evitar quebrar dados antigos
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
  netValueEstimated: number; // Pre-calculated at sale creation
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

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock Data representing "Freo Figures" realistic scenario
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Busto Cody Rhodes (Pintado)', productionCost: 55.0, indirectCost: 20.1, markup: 2.5, activeChannels: ['Site Próprio', 'Shopee', 'Mercado Livre'] },
  { id: '2', name: 'Busto Cody Rhodes (Cru)', productionCost: 45.0, indirectCost: 20.1, markup: 2.0, activeChannels: ['TikTok Shop', 'Mercado Livre'] },
  { id: '3', name: 'Miniatura WWE Ring', productionCost: 65.0, indirectCost: 35.0, markup: 3.5, activeChannels: ['Site Próprio', 'Shopee'] },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

const MOCK_SALES: Sale[] = [
  { id: 's1', date: today, channel: 'Site Próprio', productId: '1', qty: 1, grossValue: 450, discount: 0, platformFee: 15, shippingCost: 0, unitCostEstimated: 75.1, netValueEstimated: 435, status: 'vendido', notes: 'Pedido via Instagram' },
  { id: 's2', date: yesterday, channel: 'Mercado Livre', productId: '1', qty: 2, grossValue: 900, discount: 0, platformFee: 162, shippingCost: 40, unitCostEstimated: 75.1, netValueEstimated: 698, status: 'enviado', notes: 'Frete grátis oferecido' },
  { id: 's3', date: lastWeek, channel: 'TikTok Shop', productId: '2', qty: 1, grossValue: 180, discount: 10, platformFee: 20, shippingCost: 0, unitCostEstimated: 65.1, netValueEstimated: 150, status: 'concluído', notes: 'Cupom PRIMEIRA' },
];

const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: 'w1', date: today, channel: 'Site Próprio', amount: 435, destination: 'Banco Inter', notes: 'Repasse Mercado Pago' },
  { id: 'w2', date: lastWeek, channel: 'Mercado Livre', amount: 1500, destination: 'Banco Inter', notes: 'Saque semanal' },
];

const MOCK_COSTS: Cost[] = [
  { id: 'c1', date: lastWeek, category: 'matéria-prima', description: 'Compre de Resina/Filamento (5kg)', amount: 600, isRecurring: false, notes: 'Fornecedor XYZ' },
  { id: 'c2', date: lastWeek, category: 'marketing', description: 'Facebook Ads', amount: 150, isRecurring: true, notes: 'Campanha de bustos' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
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
          'Rua': { feePercent: 0, fixedFee: 0, shippingCost: 0 }
        }
      },
      products: MOCK_PRODUCTS,
      sales: MOCK_SALES,
      withdrawals: MOCK_WITHDRAWALS,
      costs: MOCK_COSTS,

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      addProduct: (product) => set((state) => ({ products: [...state.products, { ...product, id: generateId() }] })),
      updateProduct: (id, updated) => set((state) => ({ products: state.products.map(p => p.id === id ? { ...p, ...updated } : p) })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),

      addSale: (sale) => set((state) => ({ sales: [...state.sales, { ...sale, id: generateId() }] })),
      updateSale: (id, updated) => set((state) => ({ sales: state.sales.map(s => s.id === id ? { ...s, ...updated } : s) })),
      deleteSale: (id) => set((state) => ({ sales: state.sales.filter(s => s.id !== id) })),

      addWithdrawal: (withdrawal) => set((state) => ({ withdrawals: [...state.withdrawals, { ...withdrawal, id: generateId() }] })),
      updateWithdrawal: (id, updated) => set((state) => ({ withdrawals: state.withdrawals.map(w => w.id === id ? { ...w, ...updated } : w) })),
      deleteWithdrawal: (id) => set((state) => ({ withdrawals: state.withdrawals.filter(w => w.id !== id) })),

      addCost: (cost) => set((state) => ({ costs: [...state.costs, { ...cost, id: generateId() }] })),
      updateCost: (id, updated) => set((state) => ({ costs: state.costs.map(c => c.id === id ? { ...c, ...updated } : c) })),
      deleteCost: (id) => set((state) => ({ costs: state.costs.filter(c => c.id !== id) })),
    }),
    {
      name: 'freo-figures-storage',
    }
  )
);
