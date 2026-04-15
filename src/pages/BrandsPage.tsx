import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { brandService } from '@/services/api';
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
  const { brands, setBrands, addBrand, updateBrand, removeBrand } = useStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', logo: '' });

  useEffect(() => {
    brandService.getAll().then((data) => { setBrands(data); setLoading(false); });
  }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', logo: '' }); setModalOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ name: b.name, logo: b.logo }); setModalOpen(true); };

  const handleSubmit = () => {
    if (editing) {
      updateBrand(editing.id, form);
      toast.success(t('brands.brandUpdated'));
    } else {
      addBrand({ id: String(Date.now()), ...form, productCount: 0 });
      toast.success(t('brands.brandAdded'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { removeBrand(deleteId); toast.success(t('brands.brandDeleted')); setDeleteId(null); }
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
                    <img src={b.logo} alt={b.name} className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
                  </td>
                  <td className="px-4 py-3.5 font-medium">{b.name}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{b.productCount}</td>
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

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('brands.editBrand') : t('brands.addBrand')} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('brands.name')}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('brands.uploadLogo')}</Label>
            <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">{t('brands.uploadLogo')}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('brands.deleteBrand')} description={t('brands.confirmDelete')} onConfirm={handleDelete} />
    </AdminLayout>
  );
}
