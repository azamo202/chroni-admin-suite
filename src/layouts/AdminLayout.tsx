import { AppSidebar } from '@/components/AppSidebar';
import { TopBar } from '@/components/TopBar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-5 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
