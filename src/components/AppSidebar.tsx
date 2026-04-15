import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Image,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'products', icon: Package, path: '/products' },
  { key: 'categories', icon: FolderTree, path: '/categories' },
  { key: 'brands', icon: Tag, path: '/brands' },
  { key: 'media', icon: Image, path: '/media' },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isRtl = ['ar', 'ku'].includes(i18n.language);

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-sidebar text-sidebar-foreground flex flex-col border-sidebar-border transition-all duration-300 z-30',
        isRtl ? 'border-l' : 'border-r',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-primary truncate">
            {t('sidebar.catalog')}
          </span>
        )}
        {collapsed && (
          <span className="text-lg font-bold text-sidebar-primary mx-auto">C</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(`sidebar.${item.key}`)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? (
          isRtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
        ) : (
          isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
