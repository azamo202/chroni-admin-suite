export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  productCount: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  brandId: string;
  category: string;
  brand: string;
  status: 'visible' | 'hidden';
  image: string;
  images: string[];
  specs: Record<string, string>;
}

export interface ActivityLog {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
}

export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', productCount: 45 },
  { id: '2', name: 'Clothing', slug: 'clothing', productCount: 32 },
  { id: '3', name: 'Home & Garden', slug: 'home-garden', productCount: 28 },
  { id: '4', name: 'Sports', slug: 'sports', productCount: 19 },
  { id: '5', name: 'Books', slug: 'books', productCount: 15 },
  { id: '6', name: 'Automotive', slug: 'automotive', productCount: 12 },
];

export const brands: Brand[] = [
  { id: '1', name: 'TechVision', logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop', productCount: 23 },
  { id: '2', name: 'StyleCraft', logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop', productCount: 18 },
  { id: '3', name: 'HomeNest', logo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop', productCount: 15 },
  { id: '4', name: 'ActiveGear', logo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=80&h=80&fit=crop', productCount: 12 },
  { id: '5', name: 'BookWorld', logo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=80&h=80&fit=crop', productCount: 9 },
];

export const products: Product[] = [
  {
    id: '1', name: 'Wireless Headphones Pro', description: 'Premium noise-cancelling wireless headphones with 40-hour battery life.',
    price: 299.99, categoryId: '1', brandId: '1', category: 'Electronics', brand: 'TechVision',
    status: 'visible', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&h=600&fit=crop',
    ],
    specs: { 'Battery Life': '40 hours', 'Connectivity': 'Bluetooth 5.2', 'Weight': '250g', 'Driver Size': '40mm' },
  },
  {
    id: '2', name: 'Smart Watch Ultra', description: 'Advanced smartwatch with health monitoring and GPS.',
    price: 449.99, categoryId: '1', brandId: '1', category: 'Electronics', brand: 'TechVision',
    status: 'visible', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'],
    specs: { 'Display': 'AMOLED 1.9"', 'Battery': '3 days', 'Water Resistance': '100m', 'GPS': 'Dual-band' },
  },
  {
    id: '3', name: 'Leather Jacket Classic', description: 'Genuine leather jacket with a timeless design.',
    price: 189.99, categoryId: '2', brandId: '2', category: 'Clothing', brand: 'StyleCraft',
    status: 'visible', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop'],
    specs: { 'Material': 'Genuine Leather', 'Sizes': 'S-XXL', 'Color': 'Black', 'Lining': 'Polyester' },
  },
  {
    id: '4', name: 'Running Shoes X1', description: 'Lightweight performance running shoes.',
    price: 129.99, categoryId: '4', brandId: '4', category: 'Sports', brand: 'ActiveGear',
    status: 'visible', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'],
    specs: { 'Weight': '220g', 'Drop': '8mm', 'Sole': 'Carbon Fiber Plate', 'Upper': 'Engineered Mesh' },
  },
  {
    id: '5', name: 'Modern Table Lamp', description: 'Minimalist desk lamp with adjustable brightness.',
    price: 79.99, categoryId: '3', brandId: '3', category: 'Home & Garden', brand: 'HomeNest',
    status: 'hidden', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop'],
    specs: { 'Power': '12W LED', 'Material': 'Aluminum', 'Height': '45cm', 'Color Temp': '2700-6500K' },
  },
  {
    id: '6', name: 'Bestseller Novel Collection', description: 'Curated collection of top-selling novels.',
    price: 49.99, categoryId: '5', brandId: '5', category: 'Books', brand: 'BookWorld',
    status: 'visible', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop'],
    specs: { 'Pages': '~350 each', 'Format': 'Hardcover', 'Count': '5 books', 'Language': 'English' },
  },
  {
    id: '7', name: '4K Drone Explorer', description: 'Professional drone with 4K camera and obstacle avoidance.',
    price: 899.99, categoryId: '1', brandId: '1', category: 'Electronics', brand: 'TechVision',
    status: 'visible', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=600&fit=crop'],
    specs: { 'Camera': '4K 60fps', 'Flight Time': '45 min', 'Range': '10km', 'Weight': '895g' },
  },
  {
    id: '8', name: 'Yoga Mat Premium', description: 'Extra thick eco-friendly yoga mat.',
    price: 59.99, categoryId: '4', brandId: '4', category: 'Sports', brand: 'ActiveGear',
    status: 'hidden', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop'],
    specs: { 'Thickness': '8mm', 'Material': 'Natural Rubber', 'Size': '183x68cm', 'Weight': '2.5kg' },
  },
];

export const activityLogs: ActivityLog[] = [
  { id: '1', action: 'Created product', target: 'Wireless Headphones Pro', user: 'Admin', timestamp: '2024-01-15T10:30:00Z' },
  { id: '2', action: 'Updated category', target: 'Electronics', user: 'Admin', timestamp: '2024-01-15T09:15:00Z' },
  { id: '3', action: 'Added brand', target: 'TechVision', user: 'Admin', timestamp: '2024-01-14T16:45:00Z' },
  { id: '4', action: 'Toggled visibility', target: 'Modern Table Lamp', user: 'Admin', timestamp: '2024-01-14T14:20:00Z' },
  { id: '5', action: 'Deleted product', target: 'Old Widget', user: 'Admin', timestamp: '2024-01-14T11:00:00Z' },
  { id: '6', action: 'Updated price', target: 'Smart Watch Ultra', user: 'Admin', timestamp: '2024-01-13T15:30:00Z' },
  { id: '7', action: 'Created category', target: 'Automotive', user: 'Admin', timestamp: '2024-01-13T10:00:00Z' },
  { id: '8', action: 'Uploaded media', target: '5 images', user: 'Admin', timestamp: '2024-01-12T17:00:00Z' },
];

export const mediaImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop',
];

export const monthlyData = [
  { month: 'Jan', products: 12 },
  { month: 'Feb', products: 19 },
  { month: 'Mar', products: 15 },
  { month: 'Apr', products: 25 },
  { month: 'May', products: 22 },
  { month: 'Jun', products: 30 },
];

export const categoryDistribution = [
  { name: 'Electronics', value: 45, fill: 'hsl(0, 72%, 38%)' },
  { name: 'Clothing', value: 32, fill: 'hsl(0, 72%, 50%)' },
  { name: 'Home & Garden', value: 28, fill: 'hsl(0, 0%, 20%)' },
  { name: 'Sports', value: 19, fill: 'hsl(0, 0%, 40%)' },
  { name: 'Books', value: 15, fill: 'hsl(0, 0%, 60%)' },
];
