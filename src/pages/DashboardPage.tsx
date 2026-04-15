import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Package, FolderTree, Tag, EyeOff, Activity, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatCard, PageHeader } from '@/components/shared';
import { dashboardService, activityService } from '@/services/api';
import { monthlyData, categoryDistribution, type ActivityLog } from '@/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

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
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">{t('dashboard.monthlySales')}</h3>
            <Badge variant="secondary" className="text-[10px] font-normal gap-1">
              <TrendingUp className="h-3 w-3" /> +18%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 92%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(0 0% 92%)' }}
              />
              <Bar dataKey="products" fill="hsl(0, 72%, 38%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-5">{t('dashboard.categoryDist')}</h3>
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
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(0 0% 92%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.fill }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {t('dashboard.recentActivity')}
        </h3>
        <div className="divide-y">
          {activities.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.target}</p>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {new Date(a.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
