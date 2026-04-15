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
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
        'h-screen sticky top-0 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-30',
        isRtl ? 'border-l border-sidebar-border' : 'border-r border-sidebar-border',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-sidebar-accent-foreground tracking-tight truncate">
            {t('sidebar.catalog')}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          const linkContent = (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
            >
              {isActive && (
                <div className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-full',
                  isRtl ? '-right-2.5' : '-left-2.5'
                )} />
              )}
              <item.icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive ? 'text-sidebar-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground')} />
              {!collapsed && <span>{t(`sidebar.${item.key}`)}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side={isRtl ? 'left' : 'right'} className="text-xs">
                  {t(`sidebar.${item.key}`)}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-11 flex items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all duration-200"
      >
        {collapsed ? (
          isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        ) : (
          isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
