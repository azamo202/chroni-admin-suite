import { create } from 'zustand';

// واجهات الأنواع (Type Definitions) لضمان أمان الكود
interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  hiddenProducts: number;
}

interface RecentProduct {
  id: string | number;
  name: Record<string, string>; // يدعم اللغات المتعددة مثل { ar: "", en: "" }
  created_at: string;
}

interface DashboardState {
  stats: DashboardStats;
  recentProducts: RecentProduct[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // القيم الافتراضية
  stats: { totalProducts: 0, totalCategories: 0, totalBrands: 0, hiddenProducts: 0 },
  recentProducts: [],
  loading: true,
  error: null,

  // دالة جلب البيانات
  fetchData: async () => {
    set({ loading: true, error: null });
    
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      
      const response = await fetch(`${apiUrl}/api/admin/dashboard-stats`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      
      const json = await response.json();
      
      if (response.ok && json.status) {
        const d = json.data;
        set({
          stats: {
            totalProducts: d.products_count || 0,
            totalCategories: d.categories_count || 0,
            totalBrands: d.brands_count || 0,
            hiddenProducts: (d.products_count || 0) - (d.active_products || 0)
          },
          recentProducts: d.recent_products || [],
          loading: false
        });
      } else {
        set({ error: json.message || "فشل في جلب البيانات", loading: false });
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      set({ error: "حدث خطأ في الاتصال بالخادم", loading: false });
    }
  }
}));