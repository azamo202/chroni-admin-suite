import { create } from 'zustand';
import { API_BASE_URL } from '../config';

interface ProductState {
  products: any[];
  categories: any[];
  brands: any[];
  loading: boolean;
  totalPages: number;
  
  fetchData: (params?: { page?: number; search?: string; category_id?: string; category_slug?: string; brand_id?: string; model_number?: string; sort?: string; is_active?: string }) => Promise<void>;
  createProduct: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  updateProduct: (id: string | number, data: FormData) => Promise<{ success: boolean; message?: string }>;
  deleteProduct: (id: string | number) => Promise<{ success: boolean; message?: string }>;
  duplicateProduct: (id: string | number) => Promise<{ success: boolean; newProductId?: number; message?: string }>;
  updateSortOrder: (id: string | number, sortOrder: number) => Promise<{ success: boolean; message?: string }>;
  autoReorderProducts: (categoryId: string | number) => Promise<{ success: boolean; message?: string }>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  loading: true,
  totalPages: 1,

  fetchData: async (params) => {
    // نعرض التحميل فقط إذا كانت المصفوفة فارغة لتجنب وميض الشاشة عند إعادة التحديث
    if (get().products.length === 0) set({ loading: true });
    
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
      
      // بناء Query Parameters
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '50'); // إخبار الخادم بإرجاع 50 منتج في الصفحة
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category_id && params.category_id !== 'all') queryParams.append('category_id', params.category_id);
      if (params?.category_slug && params.category_slug !== 'all') queryParams.append('category_slug', params.category_slug);
      if (params?.brand_id && params.brand_id !== 'all') queryParams.append('brand_id', params.brand_id);
      if (params?.model_number) queryParams.append('model_number', params.model_number);
      if (params?.sort && params.sort !== 'latest') queryParams.append('sort', params.sort);
      if (params?.is_active && params.is_active !== 'all') queryParams.append('is_active', params.is_active);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`${apiUrl}/api/products${queryString}`, { headers }),
        fetch(`${apiUrl}/api/categories`, { headers }),
        fetch(`${apiUrl}/api/brands`, { headers })
      ]);
      
      const [prodData, catData, brandData] = await Promise.all([
        prodRes.json(), catRes.json(), brandRes.json()
      ]);
      
      const productsArray = prodData.data?.data || prodData.data || [];
      // استخراج إجمالي الصفحات من استجابة Paginator الخاصة بـ Laravel
      const total = prodData.meta?.last_page || prodData.last_page || prodData.data?.last_page || 1;
      
      set({
        products: Array.isArray(productsArray) ? productsArray : [],
        categories: catData.status || catData.data ? (catData.data || []) : [],
        brands: brandData.status || brandData.data ? (brandData.data || []) : [],
        totalPages: total,
        loading: false
      });
    } catch (err) {
      console.error("Fetch Products Data Error:", err);
      set({ loading: false });
    }
  },

  createProduct: async (formData) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/products`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        },
        body: formData
      });
      
      const json = await res.json();
      
      if (res.ok || json.status) {
        // نعيد تحميل البيانات من الخادم لعرض sort_order الصحيح المعين من الباك-إند
        await get().fetchData();
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء إضافة المنتج" };
    } catch (err) {
      console.error("Create Product Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  updateProduct: async (id, formData) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      formData.append("_method", "POST");

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
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء تحديث المنتج" };
    } catch (err) {
      console.error("Update Product Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  deleteProduct: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/products/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        }
      });
      
      if (res.ok) {
        // نعيد تحميل البيانات من الخادم لعرض قيم sort_order المحدثة بعد الحذف
        // (الباك-إند يعيد ترقيم العناصر تلقائياً عند الحذف)
        await get().fetchData();
        return { success: true };
      }
      return { success: false, message: "فشل في حذف المنتج" };
    } catch (err) {
      console.error("Delete Product Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  duplicateProduct: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const res = await fetch(`${apiUrl}/api/products/${id}/duplicate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      const json = await res.json();

      if (res.ok && json.status) {
        return { success: true, newProductId: json.data?.id };
      }
      return { success: false, message: json.message || "فشل في نسخ المنتج" };
    } catch (err) {
      console.error("Duplicate Product Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  updateSortOrder: async (id, sortOrder) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/products/${id}/sort`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: JSON.stringify({ sort_order: sortOrder })
      });
      
      const json = await res.json();
      if (res.ok && json.status) {
        return { success: true, message: json.message };
      }
      return { success: false, message: json.message || "فشل في تحديث الترتيب" };
    } catch (err) {
      console.error("Update Sort Order Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  autoReorderProducts: async (categoryId) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      
      const res = await fetch(`${apiUrl}/api/categories/${categoryId}/products/auto-reorder`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json" 
        }
      });
      
      const json = await res.json();
      if (res.ok && json.status) {
        return { success: true, message: json.message };
      }
      return { success: false, message: json.message || "فشل في إعادة الترتيب" };
    } catch (err) {
      console.error("Auto Reorder Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  }
}));