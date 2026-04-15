import { create } from 'zustand';
import type { Product, Category, Brand } from '@/data/mock';

interface AppStore {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setBrands: (brands: Brand[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  toggleProductVisibility: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, brand: Partial<Brand>) => void;
  removeBrand: (id: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  products: [],
  categories: [],
  brands: [],
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  addProduct: (product) => set((s) => ({ products: [product, ...s.products] })),
  updateProduct: (id, data) => set((s) => ({
    products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
  toggleProductVisibility: (id) => set((s) => ({
    products: s.products.map((p) =>
      p.id === id ? { ...p, status: p.status === 'visible' ? 'hidden' : 'visible' } : p
    ),
  })),
  addCategory: (category) => set((s) => ({ categories: [category, ...s.categories] })),
  updateCategory: (id, data) => set((s) => ({
    categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),
  removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
  addBrand: (brand) => set((s) => ({ brands: [brand, ...s.brands] })),
  updateBrand: (id, data) => set((s) => ({
    brands: s.brands.map((b) => (b.id === id ? { ...b, ...data } : b)),
  })),
  removeBrand: (id) => set((s) => ({ brands: s.brands.filter((b) => b.id !== id) })),
}));
