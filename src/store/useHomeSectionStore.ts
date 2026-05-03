import { create } from "zustand";
import { API_BASE_URL } from "@/config";

export interface HomeSection {
  id: number;
  title: any;
  is_active: boolean | number;
  sort_order: number;
  products?: any[];
}

interface HomeSectionStore {
  sections: HomeSection[];
  loading: boolean;
  fetchSections: () => Promise<void>;
  createSection: (data: any) => Promise<{ success: boolean; message?: string }>;
  updateSection: (id: number, data: any) => Promise<{ success: boolean; message?: string }>;
  deleteSection: (id: number) => Promise<{ success: boolean; message?: string }>;
  attachProducts: (id: number, productIds: number[]) => Promise<{ success: boolean; message?: string }>;
  detachProducts: (id: number, productIds: number[]) => Promise<{ success: boolean; message?: string }>;
}

export const useHomeSectionStore = create<HomeSectionStore>((set, get) => ({
  sections: [],
  loading: false,

  fetchSections: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (res.ok && (json.status || json.data)) {
        set({ sections: json.data?.data || json.data || [] });
      }
    } catch (error) {
      console.error("Error fetching home sections:", error);
    } finally {
      set({ loading: false });
    }
  },

  createSection: async (data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok || json.status) {
        await get().fetchSections();
        return { success: true };
      }
      return { success: false, message: json.message };
    } catch (error) {
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  updateSection: async (id, data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok || json.status) {
        await get().fetchSections();
        return { success: true };
      }
      return { success: false, message: json.message };
    } catch (error) {
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  deleteSection: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        await get().fetchSections();
        return { success: true };
      }
      const json = await res.json();
      return { success: false, message: json.message };
    } catch (error) {
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  attachProducts: async (id, productIds) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/${id}/products/attach`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ product_ids: productIds }),
      });
      const json = await res.json();
      if (res.ok || json.status) {
        await get().fetchSections();
        return { success: true };
      }
      return { success: false, message: json.message };
    } catch (error) {
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },

  detachProducts: async (id, productIds) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/${id}/products/detach`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ product_ids: productIds }),
      });
      const json = await res.json();
      if (res.ok || json.status) {
        await get().fetchSections();
        return { success: true };
      }
      return { success: false, message: json.message };
    } catch (error) {
      return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
    }
  },
}));