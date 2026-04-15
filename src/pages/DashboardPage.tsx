import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Package, FolderTree, Tag, EyeOff, Activity } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatCard } from '@/components/shared';
import { dashboardService, activityService } from '@/services/api';
import { monthlyData, categoryDistribution, type ActivityLog } from '@/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalProducts: 0, totalCategories: 0, totalBrands: 0, hiddenProducts: 0 });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.getStats(), activityService.getRecent()]).then(([s, a]) => {
      setStats(s);
      setActivities(a);
      setLoading(false);
    });
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title={t('dashboard.totalProducts')} value={stats.totalProducts} icon={<Package className="h-5 w-5" />} trend="+12%" />
        <StatCard title={t('dashboard.totalCategories')} value={stats.totalCategories} icon={<FolderTree className="h-5 w-5" />} />
        <StatCard title={t('dashboard.totalBrands')} value={stats.totalBrands} icon={<Tag className="h-5 w-5" />} />
        <StatCard title={t('dashboard.hiddenProducts')} value={stats.hiddenProducts} icon={<EyeOff className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-semibold mb-4">{t('dashboard.monthlySales')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="products" fill="hsl(0, 72%, 38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-semibold mb-4">{t('dashboard.categoryDist')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('dashboard.recentActivity')}
        </h3>
        <div className="space-y-3">
          {activities.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.target}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(a.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
