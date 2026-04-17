import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
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

export default function BrandsPage() {
  const { t } = useTranslation();
  const { brands, setBrands } = useStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string, logo: File | null }>({ name: '', logo: null });

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://127.0.0.1:8000/api/brands", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setBrands(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', logo: null }); 
    setModalOpen(true); 
  };
  
  const openEdit = (b: any) => { 
    setEditing(b); 
    setForm({ name: b.name || '', logo: null }); // لا نحتاج لتعيين الصورة القديمة في الفورم، سنرسل الصورة الجديدة فقط إذا تم تعديلها
    setModalOpen(true); 
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("name", form.name);
      if (form.logo) {
        formData.append("logo", form.logo);
      }

      // إضافة _method في حال التعديل ليتعامل Laravel مع التحديث
      if (editing) formData.append("_method", "PUT");

      const url = editing 
        ? `http://127.0.0.1:8000/api/brands/${editing.id}` 
        : "http://127.0.0.1:8000/api/brands";

      const res = await fetch(url, {
        method: "POST", // دائما POST بسبب FormData
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        body: formData
      });
      const data = await res.json();

      if (data.status || res.ok) {
        toast.success(editing ? t('brands.brandUpdated') : t('brands.brandAdded'));
        setModalOpen(false);
        fetchBrands();
      } else {
        toast.error(data.message || 'حدث خطأ في العملية');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`http://127.0.0.1:8000/api/brands/${deleteId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        if (res.ok) {
          toast.success(t('brands.brandDeleted'));
          fetchBrands();
        } else {
          toast.error('فشل حذف العلامة التجارية');
        }
      } catch (err) {
        toast.error('حدث خطأ في الاتصال بالخادم');
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title={t('brands.title')}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />{t('brands.addBrand')}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.logo')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.name')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.productCount')}</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('brands.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton cols={4} /> : brands.length === 0 ? (
                <tr><td colSpan={4}><EmptyState message={t('common.noResults')} /></td></tr>
              ) : brands.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">بدون شعار</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{b.name}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{b.products_count || '-'}</td>
                  <td className="px-4 py-3.5 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(b.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('brands.editBrand') : t('brands.addBrand')} onSubmit={handleSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('brands.name')}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('brands.uploadLogo')}</Label>
            <Input type="file" accept="image/*" className="cursor-pointer" onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] || null })} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('brands.deleteBrand')} description={t('brands.confirmDelete')} onConfirm={handleDelete} />
    </AdminLayout>
  );
}
