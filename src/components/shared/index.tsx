import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ────────────────────────────────────────────
// Form Modal
// ────────────────────────────────────────────
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  disabled?: boolean;
}

export function FormModal({ open, onOpenChange, title, description, children, onSubmit, disabled }: FormModalProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-2">{children}</div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={disabled} className="min-w-[120px]">
            {disabled ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جاري الحفظ...
              </span>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────
// Confirm Dialog
// ────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, variant = 'destructive', confirmLabel, loading }: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {variant === 'destructive' && (
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            )}
            <div>
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed">{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-2">
          <AlertDialogCancel className="h-9" disabled={loading}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9' : 'h-9'}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('common.processing', 'جاري التنفيذ...')}
              </span>
            ) : (
              confirmLabel ?? t('common.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


// ────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-card border rounded-xl p-5 flex items-start justify-between hover:shadow-md transition-all duration-200 group">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && <p className="text-xs font-medium text-success">{trend}</p>}
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
        {icon}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Empty State
// ────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ────────────────────────────────────────────
// Table Skeleton
// ────────────────────────────────────────────
export function TableSkeleton({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className={c === 0 ? 'h-4 w-10 rounded' : 'h-4 w-full rounded'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ────────────────────────────────────────────
// Pagination
// ────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SimplePagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        {t('common.showing')} {currentPage} {t('common.of')} {totalPages}
      </p>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Page Header
// ────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export { CategoryTreeSelect } from './CategoryTreeSelect';
