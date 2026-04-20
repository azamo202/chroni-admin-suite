import { API_BASE_URL } from '@/config';
import { create } from 'zustand';

// واجهات الأنواع (Type Definitions) لضمان أمان الكود
interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  hiddenProducts: number;
  monthlyData?: any[]; // ✅ تمت إضافة بيانات الرسم الشريطي
  categoryDistribution?: any[]; // ✅ تمت إضافة بيانات الرسم الدائري
  support?: {
    maintenance_centers: number;
    videos: number;
    downloads: number;
  };
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
  stats: { 
    totalProducts: 0, 
    totalCategories: 0, 
    totalBrands: 0, 
    hiddenProducts: 0,
    monthlyData: [], // ✅ إضافة القيم الافتراضية
    categoryDistribution: [] 
  },
  recentProducts: [],
  loading: true,
  error: null,

  // دالة جلب البيانات
  fetchData: async () => {
    set({ loading: true, error: null });
    
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      // تأكد أن هذا الرابط يطابق الرابط في ملف api.php في اللارافل
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
          // ✅ تم التعديل هنا: استخدام المفاتيح الجديدة المطابقة للباك اند
          stats: {
            totalProducts: d.totalProducts || 0,
            totalCategories: d.totalCategories || 0,
            totalBrands: d.totalBrands || 0,
            hiddenProducts: d.hiddenProducts || 0,
            monthlyData: d.monthlyData || [],
            categoryDistribution: d.categoryDistribution || [],
            support: d.support
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