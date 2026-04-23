import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface Brand {
  id: number;
  name: string;
  logo: string | null;
  products_count?: number;
}

interface BrandState {
  brands: Brand[];
  loading: boolean;
  fetchBrands: () => Promise<void>;
  createBrand: (data: { name: string; logo: File | null }) => Promise<{ success: boolean; message?: string }>;
  updateBrand: (id: number, data: { name: string; logo: File | null }) => Promise<{ success: boolean; message?: string }>;
  deleteBrand: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  loading: true,

  fetchBrands: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/brands`, {
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        }
      });
      
      const json = await res.json();
      if (res.ok && json.status && json.data) {
        set({ brands: json.data });
      }
    } catch (err) {
      console.error("Fetch Brands Error:", err);
    } finally {
      set({ loading: false });
    }
  },

  createBrand: async (data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      // تجهيز البيانات كـ FormData لدعم رفع الملفات
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.logo) {
        formData.append("logo", data.logo);
      }

      const res = await fetch(`${apiUrl}/api/brands`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json" 
        },
        body: formData
      });
      
      const json = await res.json();
      
      if (res.ok || json.status) {
        await get().fetchBrands(); // تحديث القائمة تلقائياً بعد الإضافة
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء إضافة العلامة التجارية" };
    } catch (err) {
      console.error("Create Brand Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  updateBrand: async (id, data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.logo) {
        formData.append("logo", data.logo);
      }
      // إضافة _method ليتعامل Laravel مع التحديث بشكل صحيح مع FormData
      formData.append("_method", "POST");

      const res = await fetch(`${apiUrl}/api/brands/${id}`, {
        method: "POST", // يجب أن يكون POST عند إرسال FormData مع Laravel
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json" 
        },
        body: formData
      });
      
      const json = await res.json();
      
      if (res.ok || json.status) {
        await get().fetchBrands(); // تحديث القائمة تلقائياً
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء تحديث العلامة التجارية" };
    } catch (err) {
      console.error("Update Brand Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  deleteBrand: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/brands/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        }
      });
      
      if (res.ok) {
        // تحديث القائمة محلياً لتجربة مستخدم أسرع (Optimistic Update)
        set((state) => ({ brands: state.brands.filter(b => b.id !== id) }));
        return { success: true };
      }
      return { success: false, message: "فشل في حذف العلامة التجارية" };
    } catch (err) {
      console.error("Delete Brand Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  }
}));