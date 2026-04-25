import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import i18n from 'i18next';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // تحديث الحالة لكي يتم عرض واجهة الخطأ البديلة في الريندر القادم
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // هنا يمكنك إرسال الخطأ إلى خدمات التتبع مثل Sentry في بيئة الإنتاج
    console.error('تم التقاط خطأ بواسطة ErrorBoundary:', error, errorInfo);
  }

  public render() {
    // استخدام دالة الترجمة من i18n مباشرة مع وضع نصوص احتياطية
    const translate = (key: string, fallback: string) => i18n.t ? i18n.t(key, fallback) : fallback;

    if (this.state.hasError) {
      return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4">
          <div className="flex max-w-md flex-col items-center text-center bg-card p-8 rounded-2xl shadow-sm border">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{translate('error.unexpected', "عذراً، حدث خطأ غير متوقع")}</h1>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
              {this.state.error?.message || translate('error.description', "واجه التطبيق مشكلة أثناء عرض هذه الصفحة.")}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" /> {translate('error.refresh', "تحديث الصفحة")}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
                <Home className="h-4 w-4" /> {translate('error.home', "الرئيسية")}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}