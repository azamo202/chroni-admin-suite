'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com'); // قيم افتراضية للتجربة بناءً على طلبك
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(data.message);
        
        // حفظ التوكن في التخزين المحلي (أو يمكنك استخدام الكوكيز لمزيد من الأمان)
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.data.admin));

        // التوجيه إلى صفحة الداشبورد بعد نجاح تسجيل الدخول
        setTimeout(() => {
          navigate('/'); 
        }, 1000);
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم، يرجى التحقق من الرابط أو المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        {/* قسم الشعار والعنوان */}
        <div className="text-center mb-8">
          {/* يمكنك استبدال العنصر التالي بصورة الشعار الحقيقية */}
          <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#D32F2F] text-[#D32F2F] font-bold text-3xl mb-4 shadow-sm">
            HC
          </div>
          <h2 className="text-2xl font-bold text-gray-800">تسجيل الدخول للإدارة</h2>
          <p className="text-sm text-gray-500 mt-2">يرجى إدخال بياناتك للوصول إلى لوحة التحكم</p>
        </div>

        {/* التنبيهات (النجاح أو الخطأ) */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm text-center font-medium">
            {success}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-colors bg-gray-50 focus:bg-white text-gray-900 outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-colors bg-gray-50 focus:bg-white text-gray-900 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#D32F2F] hover:bg-[#B71C1C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D32F2F] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التحقق...
              </span>
            ) : (
              'دخول'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}