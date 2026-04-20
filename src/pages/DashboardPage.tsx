import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { Package, FolderTree, Tag, EyeOff, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard, PageHeader } from '@/components/shared';
import { monthlyData, categoryDistribution } from '@/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/store/useDashboardStore';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  
  // استدعاء الحالة من Zustand
  const { stats, recentProducts, loading, error, fetchData } = useDashboardStore();

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // استخدام useMemo لتحسين الأداء: إعادة حساب الأنشطة فقط عند تغير اللغة أو البيانات القادمة من السيرفر
  const activities = useMemo(() => {
    const currentLang = i18n.language || 'ar';
    return recentProducts.map((p) => ({
      id: p.id.toString(),
      action: t('products.addProduct'), 
      target: p.name?.[currentLang] || p.name?.ar || p.name?.en || 'منتج جديد',
      timestamp: p.created_at
    }));
  }, [recentProducts, i18n.language, t]);

  // عرض حالة التحميل (يفضل استبدالها بـ Skeleton Loader في بيئة الإنتاج)
  // نظهر شاشة التحميل للداشبورد فقط إذا لم يكن لدينا بيانات بالفعل
  if (loading && recentProducts.length === 0) {
    return (
      <>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D32F2F]"></div>
        </div>
      </>
    );
  }

  // عرض الأخطاء إن وجدت
  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[60vh] text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <p className="text-lg font-medium">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
            إعادة المحاولة
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle') || 'Overview of your catalog'} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('dashboard.totalProducts')} value={stats.totalProducts} icon={<Package className="h-5 w-5" />} trend="+12%" />
        <StatCard title={t('dashboard.totalCategories')} value={stats.totalCategories} icon={<FolderTree className="h-5 w-5" />} />
        <StatCard title={t('dashboard.totalBrands')} value={stats.totalBrands} icon={<Tag className="h-5 w-5" />} />
        <StatCard title={t('dashboard.hiddenProducts')} value={stats.hiddenProducts} icon={<EyeOff className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.monthlySales')}</h3>
            <Badge variant="secondary" className="text-[10px] font-normal gap-1 bg-green-50 text-green-700 border-green-200">
              <TrendingUp className="h-3 w-3" /> +18%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 92%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(0 0% 92%)' }}
              />
              <Bar dataKey="products" fill="#D32F2F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-5 text-gray-800">{t('dashboard.categoryDist')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {categoryDistribution.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(0 0% 92%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.fill }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {t('dashboard.recentActivity')}
        </h3>
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activities.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50/50 transition-colors px-2 rounded-md">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-800">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.target}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
                  {new Date(a.timestamp).toLocaleDateString(i18n.language)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-500">
            لا توجد أنشطة حديثة لعرضها.
          </div>
        )}
      </div>
    </>
  );
}