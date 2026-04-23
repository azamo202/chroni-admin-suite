import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminState {
  profile: AdminProfile | null;
  admins: AdminProfile[];
  loading: boolean;
  loadingAdmins: boolean;
  isLoggingOut: boolean;
  fetchProfile: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  logout: () => Promise<void>;
  createAdmin: (adminData: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
  updateAdmin: (id: number, adminData: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
  deleteAdmin: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export const useAdminStore = create<AdminState>((set, get) => {
  // التحقق من وجود بيانات مخزنة مسبقاً لتسريع العرض الأولي (Hydration)
  const cachedProfile = localStorage.getItem("admin_data");

  return {
    profile: cachedProfile ? JSON.parse(cachedProfile) : null,
    admins: [],
    loading: !cachedProfile,
    loadingAdmins: false,
    isLoggingOut: false,

    fetchProfile: async () => {
      const { profile } = get();
      if (!profile) set({ loading: true });

      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        const res = await fetch(`${apiUrl}/api/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        
        const json = await res.json();
        
        if (res.ok && json.status && json.data) {
          set({ profile: json.data });
          localStorage.setItem("admin_data", JSON.stringify(json.data));
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      } finally {
        set({ loading: false });
      }
    },

    fetchAdmins: async () => {
      set({ loadingAdmins: true });
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        const res = await fetch(`${apiUrl}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        
        const json = await res.json();
        
        if (res.ok && (json.status || json.data)) {
          // دعم البيانات سواء كانت مصفوفة مباشرة أو داخل كائن Paginator الخاص بلارافل
          const adminsArray = json.data?.data || json.data || [];
          set({ admins: adminsArray });
        }
      } catch (err) {
        console.error("Admins Fetch Error:", err);
      } finally {
        set({ loadingAdmins: false });
      }
    },

    logout: async () => {
      set({ isLoggingOut: true });
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        await fetch(`${apiUrl}/api/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } catch (err) {
        console.error("Logout Error:", err);
      } finally {
        // تنظيف التخزين المحلي سواء نجح الاتصال بالخادم أم فشل
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
        set({ profile: null, isLoggingOut: false });
      }
    },

    createAdmin: async (adminData) => {
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        const res = await fetch(`${apiUrl}/api/admin/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(adminData),
        });

        const data = await res.json();

        if (res.ok || data.status) {
          return { success: true };
        } else {
          return { success: false, message: data.message || "حدث خطأ أثناء إنشاء المدير" };
        }
      } catch (err) {
        console.error("Create Admin Error:", err);
        return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
      }
    },

    updateAdmin: async (id, adminData) => {
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(adminData),
        });

        const data = await res.json();

        if (res.ok || data.status) {
          return { success: true };
        } else {
          return { success: false, message: data.message || "حدث خطأ أثناء تحديث المدير" };
        }
      } catch (err) {
        console.error("Update Admin Error:", err);
        return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
      }
    },

    deleteAdmin: async (id) => {
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = API_BASE_URL;

        const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          // تحديث محلي سريع (Optimistic Update)
          set((state) => ({ admins: state.admins.filter((admin) => admin.id !== id) }));
          return { success: true };
        }
        const data = await res.json();
        return { success: false, message: data.message || "فشل حذف المدير" };
      } catch (err) {
        console.error("Delete Admin Error:", err);
        return { success: false, message: "حدث خطأ في الاتصال بالخادم" };
      }
    }
  };
});