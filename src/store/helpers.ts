import { API_BASE_URL } from '@/config';

export const getValidImageUrl = (path: string | null) => {
  if (!path) return '';

  let cleanPath = path;

  // إذا كان الرابط يحتوي على النطاق الخاطئ أو نطاق الباك إند، نقوم بإزالته لتنظيف المسار وإعادة بنائه بشكل صحيح
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    if (cleanPath.includes('dashboard.chranico.com') || cleanPath.includes('api.chranico.com')) {
      cleanPath = cleanPath.replace(/^https?:\/\/(dashboard|api)\.chranico\.com\/(storage\/)?/, '');
    } else {
      // إذا كان رابطاً خارجياً تماماً، نرجعه كما هو
      return cleanPath;
    }
  }

  // 1. تحديد رابط الباك إند بشكل صريح
  const backendUrl = 'https://api.chranico.com';

  // 2. تنظيف المسار من أي أخطاء (إزالة storage أو products المكررة)
  cleanPath = cleanPath.replace(/^storage\//, ''); // يحذف storage/ من البداية لو وجدت
  cleanPath = cleanPath.replace(/^products\/products\//, 'products/'); // يصلح التكرار

  // 3. التأكد من وجود مجلد products
  if (!cleanPath.startsWith('products/')) {
    cleanPath = `products/${cleanPath}`;
  }

  // 4. دمج الرابط النهائي الصحيح
  return `${backendUrl}/storage/${cleanPath}`;
};