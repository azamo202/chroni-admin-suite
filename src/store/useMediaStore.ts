import { create } from 'zustand';
import { API_BASE_URL } from '@/config';

// تعريف الواجهات (Interfaces)
export interface MaintenanceCenter {
  id: number;
  name: any;
  city?: any;
  phone?: string | string[];
  phone_number?: string | string[];
  address: any;
  location_link?: string;
  sort_order?: number;
}

export interface SupportVideo {
  id: number;
  title: any;
  youtube_url?: string;
  url?: string;
  video_url?: string;
  sort_order?: number;
}

export interface SupportDownload {
  id: number;
  title?: any;
  name?: any;
  file_url?: string;
  url?: string;
  sort_order?: number;
}

interface MediaState {
  centers: MaintenanceCenter[];
  videos: SupportVideo[];
  downloads: SupportDownload[];
  loading: boolean;
  
  fetchData: (force?: boolean) => Promise<void>;
  
  // مراكز الصيانة
  createCenter: (data: any) => Promise<{ success: boolean; message?: string }>;
  updateCenter: (id: number, data: any) => Promise<{ success: boolean; message?: string }>;
  deleteCenter: (id: number) => Promise<{ success: boolean; message?: string }>;
  
  // فيديوهات الدعم
  createVideo: (data: any) => Promise<{ success: boolean; message?: string }>;
  updateVideo: (id: number, data: any) => Promise<{ success: boolean; message?: string }>;
  deleteVideo: (id: number) => Promise<{ success: boolean; message?: string }>;
  
  // الملفات والكتالوجات
  createDownload: (data: FormData) => Promise<{ success: boolean; message?: string }>;
  updateDownload: (id: number, data: FormData) => Promise<{ success: boolean; message?: string }>;
  deleteDownload: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  centers: [],
  videos: [],
  downloads: [],
  loading: true,

  fetchData: async (force = false) => {
    const { centers, videos, downloads } = get();
    // استخدام التخزين المؤقت الداخلي للمتجر ما لم يُطلب التحديث الإجباري
    if (!force && (centers.length > 0 || videos.length > 0 || downloads.length > 0)) {
      set({ loading: false });
      return;
    }

    set({ loading: true });
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
      
      const [centersRes, videosRes, downloadsRes] = await Promise.all([
        fetch(`${apiUrl}/api/maintenance-centers`, { headers }),
        fetch(`${apiUrl}/api/support-videos`, { headers }),
        fetch(`${apiUrl}/api/support-downloads`, { headers })
      ]);
      
      const [centersData, videosData, downloadsData] = await Promise.all([
        centersRes.json(), videosRes.json(), downloadsRes.json()
      ]);

      set({
        centers: centersData.data || [],
        videos: videosData.data || [],
        downloads: downloadsData.data || [],
        loading: false
      });
    } catch (err) {
      console.error("Error fetching media data:", err);
      set({ loading: false });
    }
  },

  // --- عمليات مراكز الصيانة ---
  createCenter: async (data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/maintenance-centers`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  updateCenter: async (id, data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/maintenance-centers/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  deleteCenter: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/maintenance-centers/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) { await get().fetchData(true); return { success: true }; }
      return { success: false };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  // --- عمليات فيديوهات الدعم ---
  createVideo: async (data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/support-videos`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  updateVideo: async (id, data) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/support-videos/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  deleteVideo: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/support-videos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) { await get().fetchData(true); return { success: true }; }
      return { success: false };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  // --- عمليات الملفات والكتالوجات ---
  createDownload: async (formData) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/support-downloads`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        body: formData
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  updateDownload: async (id, formData) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      formData.append("_method", "PUT"); // إرسال PUT كـ POST لدعم رفع الملفات في لارافيل
      const res = await fetch(`${apiUrl}/api/support-downloads/${id}`, {
        method: "POST", 
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        body: formData
      });
      const json = await res.json();
      if (res.ok || json.status) { await get().fetchData(true); return { success: true }; }
      return { success: false, message: json.message };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  },

  deleteDownload: async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/support-downloads/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) { await get().fetchData(true); return { success: true }; }
      return { success: false };
    } catch (err) { return { success: false, message: "خطأ في الاتصال بالخادم" }; }
  }
}));