import { create } from 'zustand';
import { API_BASE_URL } from '@/config';

interface ProductDetailState {
  product: any | null;
  loading: boolean;
  error: string | null;
  isToggling: boolean;
  fetchProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string, currentStatus: boolean) => Promise<{ success: boolean; message?: string }>;
}

export const useProductDetailStore = create<ProductDetailState>((set, get) => ({
  product: null,
  loading: true,
  error: null,
  isToggling: false,

  fetchProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const res = await fetch(`${apiUrl}/api/products/${id}`, {
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        }
      });
      
      const json = await res.json();
      
      if (res.ok && json.status && json.data) {
        set({ product: json.data, loading: false });
      } else {
        set({ error: json.message || "المنتج غير موجود أو تم حذفه", loading: false });
      }
    } catch (err) {
      console.error("Fetch Product Error:", err);
      set({ error: "حدث خطأ في الاتصال بالخادم", loading: false });
    }
  },

  toggleProductStatus: async (id: string, currentStatus: boolean) => {
    set({ isToggling: true });
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const formData = new FormData();
      formData.append("_method", "post");
      formData.append("is_active", currentStatus ? "0" : "1");

      const res = await fetch(`${apiUrl}/api/products/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: formData
      });

      const json = await res.json();

      if (res.ok || json.status) {
        // تحديث واجهة المستخدم محلياً فوراً (Optimistic Update)
        set((state) => ({
          product: state.product ? { ...state.product, is_active: !currentStatus } : null,
          isToggling: false
        }));
        return { success: true };
      }
      
      set({ isToggling: false });
      return { success: false, message: json.message || "فشل تغيير حالة المنتج" };
    } catch (err) {
      console.error("Toggle Status Error:", err);
      set({ isToggling: false });
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  }
}));