import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useBrandStore, Brand } from '@/store/useBrandStore';
import { FormModal, ConfirmDialog, TableSkeleton, EmptyState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function BrandsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // استدعاء المتجر الجديد
  const { brands, loading, fetchBrands, createBrand, updateBrand, deleteBrand } = useBrandStore();
  
  // حالات واجهة المستخدم
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string, logo: File | null }>({ name: '', logo: null });

  // التحكم في دورة حياة الجلب باستخدام React Query
  useQuery({
    queryKey: ['brands-list'],
    queryFn: async () => {
      await fetchBrands();
      return true; // القيمة المرجعة غير مهمة، المهم تنفيذ الدالة
    },
    staleTime: Infinity, // الكاش لانهائي لتجنب إعادة الجلب عند التنقل
  });

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', logo: null }); 
    setModalOpen(true); 
  };
  
  const openEdit = (b: Brand) => { 
    setEditing(b); 
    setForm({ name: b.name || '', logo: null }); 
    setModalOpen(true); 
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(t('brands.enterName', "يرجى إدخال اسم العلامة التجارية"));
      return;
    }

    setIsSubmitting(true);
    
    const response = editing 
      ? await updateBrand(editing.id, form)
      : await createBrand(form);

    if (response.success) {
      toast.success(editing ? t('brands.brandUpdated') : t('brands.brandAdded'));
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['brands-list'] }); // إخبار React Query بإعادة الجلب بذكاء
    } else {
      toast.error(response.message);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const response = await deleteBrand(deleteId);
    
    if (response.success) {
      toast.success(t('brands.brandDeleted'));
      queryClient.invalidateQueries({ queryKey: ['brands-list'] }); // إخبار React Query بإعادة الجلب بذكاء
    } else {
      toast.error(response.message || t('brands.deleteFailed', 'فشل حذف العلامة التجارية'));
    }
    
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title={t('brands.title')}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />{t('brands.addBrand')}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.logo')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.name')}</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={3} />
              ) : brands.length === 0 ? (
                <tr><td colSpan={3}><EmptyState message={t('common.noResults')} /></td></tr>
              ) : brands.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="h-9 w-9 rounded-lg object-cover ring-1 ring-border shadow-sm" />
                    ) : (
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">{t('brands.noLogo', 'بدون شعار')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{b.name}</td>
                  <td className="px-4 py-3.5 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(b.id)} className="text-destructive focus:bg-red-50 focus:text-destructive cursor-pointer"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Brand */}
      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('brands.editBrand') : t('brands.addBrand')} onSubmit={handleSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">{t('brands.name')}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('brands.enterNamePlaceholder', "أدخل اسم العلامة التجارية")} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">{t('brands.uploadLogo')}</Label>
            <Input 
              type="file" 
              accept="image/*" 
              className="cursor-pointer h-9 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" 
              onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] || null })} 
            />
            {editing && !form.logo && editing.logo && (
              <p className="text-[10px] text-muted-foreground mt-1">{t('brands.keepLogo', 'اترك الحقل فارغاً للاحتفاظ بالشعار الحالي.')}</p>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('brands.deleteBrand')} description={t('brands.confirmDelete')} onConfirm={handleDelete} />
    </>
  );
}