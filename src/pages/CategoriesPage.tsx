import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { categoryService } from '@/services/api';
import { FormModal, ConfirmDialog, TableSkeleton, EmptyState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
      <PageHeader
        title={t('categories.title')}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />{t('categories.addCategory')}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('categories.name')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('categories.slug')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('categories.productCount')}</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('categories.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton cols={4} /> : categories.length === 0 ? (
                <tr><td colSpan={4}><EmptyState message={t('common.noResults')} /></td></tr>
              ) : categories.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5 font-medium">{c.name}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="secondary" className="font-mono text-[11px]">{c.slug}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{c.productCount}</td>
                  <td className="px-4 py-3.5 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t('categories.editCategory') : t('categories.addCategory')} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('categories.name')}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('categories.slug')}</Label>
            <Input className="h-9 font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t('categories.deleteCategory')} description={t('categories.confirmDelete')} onConfirm={handleDelete} />
    </AdminLayout>
  );
}
