"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config';


// تعريف واجهة استجابة الخادم لضمان أمان الأنواع
interface LoginResponse {
  status: boolean;
  message?: string;
  data?: {
    token: string;
    admin: Record<string, unknown>;
  };
}

export default function AdminLogin() {
  const { t, i18n } = useTranslation();
  const isRtl = ['ar', 'ku'].includes(i18n.language);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق المبدئي من البيانات
    if (!email.trim() || !password.trim()) {
      setError(t('login.emptyFields', "يرجى إدخال البريد الإلكتروني وكلمة المرور."));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.status && data.data) {
        setSuccess(data.message || "تم تسجيل الدخول بنجاح.");

        // ملاحظة أمنية: في بيئات الإنتاج عالية الحساسية، يُفضل تخزين التوكن في HttpOnly Cookies بدلاً من LocalStorage
        localStorage.setItem("admin_token", data.data.token);
        localStorage.setItem("admin_data", JSON.stringify(data.data.admin));

        // التوجيه الفوري إلى صفحة الداشبورد
        navigate("/");
      } else {
        setError(
          data.message || "بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.",
        );
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(
        "حدث خطأ في الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        {/* قسم الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D32F2F]/30 to-red-100 blur-md scale-110"></div>
              <div className="relative h-24 w-24 rounded-full bg-white border-4 border-[#D32F2F] shadow-xl p-1">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t('login.title', "تسجيل الدخول للإدارة")}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {t('login.subtitle', "يرجى إدخال بياناتك للوصول إلى لوحة التحكم")}
          </p>
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
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('login.email', "البريد الإلكتروني")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] transition-colors bg-gray-50 focus:bg-white text-gray-900 outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('login.password', "كلمة المرور")}
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
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('login.verifying', "جاري التحقق...")}
              </span>
            ) : (
              t('login.submit', "دخول")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
