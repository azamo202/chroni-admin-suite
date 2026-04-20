import { create } from 'zustand';

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
  loading: boolean;
  isLoggingOut: boolean;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  createAdmin: (adminData: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
}

export const useAdminStore = create<AdminState>((set, get) => {
  // التحقق من وجود بيانات مخزنة مسبقاً لتسريع العرض الأولي (Hydration)
  const cachedProfile = localStorage.getItem("admin_data");

  return {
    profile: cachedProfile ? JSON.parse(cachedProfile) : null,
    loading: !cachedProfile,
    isLoggingOut: false,

    fetchProfile: async () => {
      const { profile } = get();
      if (!profile) set({ loading: true });

      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

    logout: async () => {
      set({ isLoggingOut: true });
      try {
        const token = localStorage.getItem("admin_token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
    }
  };
});