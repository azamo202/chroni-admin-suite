import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { brandService } from '@/services/api';
import { FormModal, ConfirmDialog, TableSkeleton, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('brands.title')}</h1>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />{t('brands.addBrand')}</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start p-3 font-medium">{t('brands.logo')}</th>
              <th className="text-start p-3 font-medium">{t('brands.name')}</th>
              <th className="text-start p-3 font-medium">{t('brands.productCount')}</th>
              <th className="text-start p-3 font-medium">{t('brands.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton cols={4} /> : brands.length === 0 ? (
              <tr><td colSpan={4}><EmptyState message={t('common.noResults')} /></td></tr>
            ) : brands.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3"><img src={b.logo} alt={b.name} className="h-10 w-10 rounded object-cover" /></td>
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3">{b.productCount}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.edit')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(b.id)} className="text-destructive"><Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('brands.editBrand') : t('brands.addBrand')} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>{t('brands.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <Label>{t('brands.uploadLogo')}</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{t('brands.uploadLogo')}</p>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('brands.deleteBrand')} description={t('brands.confirmDelete')} onConfirm={handleDelete} />
    </AdminLayout>
  );
}
