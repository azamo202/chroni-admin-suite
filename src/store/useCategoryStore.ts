import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface Category {
  id: string | number;
  name: any; // يمكن أن يكون نص JSON أو كائن (Object)
  image: string | null;
  is_active: number | boolean;
  parent_id: string | number | null;
  sort_order?: number;
  children?: Category[];
}

export interface CategoryFormData {
  nameAr: string;
  nameEn: string;
  nameKu: string;
  isActive: string;
  parentId: string;
  sortOrder: string;
  image: File | null;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CategoryFormData) => Promise<{ success: boolean; message?: string }>;
  updateCategory: (id: string | number, data: CategoryFormData) => Promise<{ success: boolean; message?: string }>;
  deleteCategory: (id: string | number) => Promise<{ success: boolean; message?: string }>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: true,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const res = await fetch(`${apiUrl}/api/categories`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });
      const json = await res.json();
      
      if (res.ok && (json.status || json.data)) {
        set({ categories: json.data || [] });
      }
    } catch (err) {
      console.error("Fetch Categories Error:", err);
    } finally {
      set({ loading: false });
    }
  },

  createCategory: async (data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const formData = new FormData();
      formData.append("name[ar]", data.nameAr);
      formData.append("name[en]", data.nameEn || data.nameAr);
      formData.append("name[ku]", data.nameKu || data.nameAr);
      formData.append("is_active", data.isActive);
      formData.append("parent_id", data.parentId || "");
      // إرسال sort_order كما هو — القيمة الفارغة تعني "آخر مكان" للباك-إند
      formData.append("sort_order", data.sortOrder ?? "");
      if (data.image) formData.append("image", data.image);

      const res = await fetch(`${apiUrl}/api/categories`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok || json.status) {
        await get().fetchCategories(); // تحديث القائمة
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء إضافة القسم" };
    } catch (err) {
      console.error("Create Category Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  updateCategory: async (id, data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const formData = new FormData();
      formData.append("name[ar]", data.nameAr);
      formData.append("name[en]", data.nameEn || data.nameAr);
      formData.append("name[ku]", data.nameKu || data.nameAr);
      formData.append("is_active", data.isActive);
      formData.append("parent_id", data.parentId || ""); // إرسال القيمة الفارغة لكي يقوم الخادم بجعلها Null
      // إرسال sort_order كما هو — القيمة الفارغة تعني "احتفظ بالترتيب الحالي" للباك-إند
      formData.append("sort_order", data.sortOrder ?? "");
      if (data.image) formData.append("image", data.image);
      
      // تم التصحيح: Laravel يحتاج PUT مع FormData وليس POST
      formData.append("_method", "post"); 

      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: "POST", // يظل POST في الـ Fetch، و Laravel يقرأ الـ _method
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok || json.status) {
        await get().fetchCategories();
        return { success: true };
      }
      return { success: false, message: json.message || "حدث خطأ أثناء تحديث القسم" };
    } catch (err) {
      console.error("Update Category Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  deleteCategory: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;

      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (res.ok) {
        await get().fetchCategories();
        return { success: true };
      }
      return { success: false, message: "فشل حذف القسم" };
    } catch (err) {
      console.error("Delete Category Error:", err);
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  }
}));