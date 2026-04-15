// Service layer abstraction - ready to connect to Laravel API
import {
  products as mockProducts,
  categories as mockCategories,
  brands as mockBrands,
  activityLogs as mockActivityLogs,
  type Product,
  type Category,
  type Brand,
  type ActivityLog,
} from '@/data/mock';

// Simulated async delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Products
export const productService = {
  async getAll(): Promise<Product[]> {
    await delay();
    return [...mockProducts];
  },
  async getById(id: string): Promise<Product | undefined> {
    await delay();
    return mockProducts.find(p => p.id === id);
  },
  async create(product: Omit<Product, 'id'>): Promise<Product> {
    await delay();
    return { ...product, id: String(Date.now()) };
  },
  async update(id: string, product: Partial<Product>): Promise<Product> {
    await delay();
    const existing = mockProducts.find(p => p.id === id);
    return { ...existing!, ...product };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
  async toggleVisibility(id: string): Promise<Product> {
    await delay();
    const product = mockProducts.find(p => p.id === id)!;
    return { ...product, status: product.status === 'visible' ? 'hidden' : 'visible' };
  },
};

// Categories
export const categoryService = {
  async getAll(): Promise<Category[]> {
    await delay();
    return [...mockCategories];
  },
  async create(category: Omit<Category, 'id'>): Promise<Category> {
    await delay();
    return { ...category, id: String(Date.now()) };
  },
  async update(id: string, category: Partial<Category>): Promise<Category> {
    await delay();
    const existing = mockCategories.find(c => c.id === id);
    return { ...existing!, ...category };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

// Brands
export const brandService = {
  async getAll(): Promise<Brand[]> {
    await delay();
    return [...mockBrands];
  },
  async create(brand: Omit<Brand, 'id'>): Promise<Brand> {
    await delay();
    return { ...brand, id: String(Date.now()) };
  },
  async update(id: string, brand: Partial<Brand>): Promise<Brand> {
    await delay();
    const existing = mockBrands.find(b => b.id === id);
    return { ...existing!, ...brand };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

// Activity Logs
export const activityService = {
  async getRecent(): Promise<ActivityLog[]> {
    await delay();
    return [...mockActivityLogs];
  },
};

// Dashboard Stats
export const dashboardService = {
  async getStats() {
    await delay();
    return {
      totalProducts: mockProducts.length,
      totalCategories: mockCategories.length,
      totalBrands: mockBrands.length,
      hiddenProducts: mockProducts.filter(p => p.status === 'hidden').length,
    };
  },
};
