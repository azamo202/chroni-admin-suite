import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HomeSectionsPage from "./pages/HomeSectionsPage";


const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CategoryProductsPage = lazy(() => import("./pages/CategoryProductsPage"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const AdminsPage = lazy(() => import("./pages/AdminsPage"));



const queryClient = new QueryClient();

// اعتراض جميع طلبات الخادم (Fetch Interceptor) للتعامل مع التوكن المنتهي
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  // إذا استجاب الخادم بخطأ 401 (غير مصرح) والمستخدم ليس في صفحة تسجيل الدخول
  if (response.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem("admin_token");
    // توجيه المستخدم لصفحة تسجيل الدخول فوراً
    window.location.href = '/login';
  }
  return response;
};

// مكون المسار المحمي (Protected Route)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("admin_token");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Loading = () => (
  <div className="flex h-[80vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// تجميع التخطيط الخارجي للحفاظ على السايد بار ثابتاً أثناء التنقل
const AppLayout = () => (
  <ProtectedRoute>
    <AdminLayout>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<Loading />}><Login /></Suspense>} />
            
            {/* استخدام AppLayout للمسارات المحمية بحيث لا يُعاد تحميل السايد بار */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/AdminsPage" element={<AdminsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:id/products" element={<CategoryProductsPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/home-sections" element={<HomeSectionsPage />} />
            </Route>
            <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
