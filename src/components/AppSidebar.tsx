import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Image,
  Settings,
  ChevronLeft, // سنحتاج فقط لسهم واحد وسنقوم بتدويره
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LayoutTemplate } from "lucide-react"; // أو أي أيقونة تفضلها

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'products', icon: Package, path: '/products' },
  { key: 'homeSections', icon: LayoutTemplate, path: '/home-sections' },
  { key: 'categories', icon: FolderTree, path: '/categories' },
  { key: 'brands', icon: Tag, path: '/brands' },
  { key: 'media', icon: Image, path: '/media' },
  { key: 'admins', icon: Users, path: '/AdminsPage' },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRtl = ['ar', 'ku'].includes(i18n.language);
  
  // تهيئة الحالة مع التحقق من localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // حفظ الحالة عند تغييرها
  const toggleCollapse = () => {
    setCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-30 shrink-0 overflow-x-hidden',
        isRtl ? 'border-l border-sidebar-border' : 'border-r border-sidebar-border',
        collapsed ? 'w-[72px]' : 'w-64' // زيادة بسيطة في عرض الوضع المطوي لإعطاء مساحة مريحة للأيقونات
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3 overflow-hidden">
        <div className="h-9 w-9 shrink-0 flex items-center justify-center">
          <img src="/images/logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <span
          className={cn(
            'text-base font-bold text-sidebar-accent-foreground tracking-tight transition-all duration-300 whitespace-nowrap overflow-hidden',
            collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
          )}
        >
          {t('sidebar.catalog')}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          const linkContent = (
            <Link
              key={item.key}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 group relative',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary', // دعم لوحة المفاتيح
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-full transition-all duration-300',
                  isRtl ? '-right-3' : '-left-3'
                )} />
              )}
              
              <item.icon 
                className={cn(
                  'h-5 w-5 shrink-0 transition-all duration-200', 
                  isActive 
                    ? 'text-sidebar-primary' 
                    : 'text-sidebar-muted group-hover:text-sidebar-foreground group-hover:scale-110' // تأثير تكبير بسيط عند التمرير
                )} 
              />
              
              <span className={cn(
                'transition-all duration-300 whitespace-nowrap overflow-hidden',
                collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
              )}>
                {t(`sidebar.${item.key}`)}
              </span>
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side={isRtl ? 'left' : 'right'} className="text-xs font-medium">
                  {t(`sidebar.${item.key}`)}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-primary"
      >
        <ChevronLeft 
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            // كود ذكي لتحديد اتجاه السهم بناءً على حالة الطي ولغة الموقع
            collapsed !== isRtl ? "rotate-180" : ""
          )} 
        />
      </button>
    </aside>
  );
}