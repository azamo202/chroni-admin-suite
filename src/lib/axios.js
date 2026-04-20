import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// "السحر" هنا: إرسال التوكن واللغة مع كل طلب تلقائياً
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token'); // أو من الكوكيز
  const lang = localStorage.getItem('app_lang') || 'ar'; 

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.headers['Accept-Language'] = lang;
  config.headers['Accept'] = 'application/json';
  
  return config;
});

export default api;