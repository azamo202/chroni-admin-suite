import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { categoryService } from '@/services/api';
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

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, setCategories, addCategory, updateCategory, removeCategory } = useStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  useEffect(() => {
    categoryService.getAll().then((data) => { setCategories(data); setLoading(false); });
  }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', slug: '' }); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug }); setModalOpen(true); };

  const handleSubmit = () => {
    if (editing) {
      updateCategory(editing.id, form);
      toast.success(t('categories.categoryUpdated'));
    } else {
      addCategory({ id: String(Date.now()), ...form, productCount: 0 });
      toast.success(t('categories.categoryAdded'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { removeCategory(deleteId); toast.success(t('categories.categoryDeleted')); setDeleteId(null); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />{t('categories.addCategory')}</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start p-3 font-medium">{t('categories.name')}</th>
              <th className="text-start p-3 font-medium">{t('categories.slug')}</th>
              <th className="text-start p-3 font-medium">{t('categories.productCount')}</th>
              <th className="text-start p-3 font-medium">{t('categories.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton cols={4} /> : categories.length === 0 ? (
              <tr><td colSpan={4}><EmptyState message={t('common.noResults')} /></td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.productCount}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.edit')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="text-destructive"><Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('categories.editCategory') : t('categories.addCategory')} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>{t('categories.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
          <div><Label>{t('categories.slug')}</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('categories.deleteCategory')} description={t('categories.confirmDelete')} onConfirm={handleDelete} />
    </AdminLayout>
  );
}
