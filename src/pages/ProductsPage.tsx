import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { productService } from '@/services/api';
import { FormModal, ConfirmDialog, SimplePagination, TableSkeleton, EmptyState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 6;

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, setProducts, addProduct, updateProduct, removeProduct, toggleProductVisibility, categories, brands } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', brandId: '', status: 'visible' as const });

  useEffect(() => {
    productService.getAll().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === 'all' || p.categoryId === filterCategory;
      const matchBrand = filterBrand === 'all' || p.brandId === filterBrand;
      return matchSearch && matchCategory && matchBrand;
    });
  }, [products, search, filterCategory, filterBrand]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', categoryId: '', brandId: '', status: 'visible' });
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), categoryId: p.categoryId, brandId: p.brandId, status: p.status });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const cat = categories.find(c => c.id === form.categoryId);
    const br = brands.find(b => b.id === form.brandId);
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...form,
        price: Number(form.price),
        category: cat?.name || '',
        brand: br?.name || '',
      });
      toast.success(t('products.productUpdated'));
    } else {
      addProduct({
        id: String(Date.now()),
        ...form,
        price: Number(form.price),
        category: cat?.name || '',
        brand: br?.name || '',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
        images: [],
        specs: {},
      });
      toast.success(t('products.productAdded'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      removeProduct(deleteId);
      toast.success(t('products.productDeleted'));
      setDeleteId(null);
    }
  };

  const handleToggle = (id: string) => {
    toggleProductVisibility(id);
    toast.success(t('products.visibilityToggled'));
  };

  return (
    <AdminLayout>
      <PageHeader
        title={t('products.title')}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t('products.addProduct')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            placeholder={t('products.searchByName')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ltr:pl-9 rtl:pr-9 h-8 text-sm"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder={t('products.filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.all')}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBrand} onValueChange={(v) => { setFilterBrand(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder={t('products.filterByBrand')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.all')}</SelectItem>
            {brands.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.image')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.name')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.brand')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.category')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.price')}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.status')}</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={7} rows={5} />
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message={t('common.noResults')} /></td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/products/${p.id}`)} className="font-medium hover:text-primary transition-colors text-start text-sm">
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{p.brand}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{p.category}</td>
                    <td className="px-4 py-3 font-medium text-sm">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(p.id)}
                        className="inline-flex items-center"
                      >
                        <Badge
                          variant={p.status === 'visible' ? 'default' : 'secondary'}
                          className={`text-[11px] cursor-pointer transition-colors ${
                            p.status === 'visible'
                              ? 'bg-success/10 text-success hover:bg-success/20 border-0'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {p.status === 'visible' ? (
                            <><Eye className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('products.visible')}</>
                          ) : (
                            <><EyeOff className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('products.hidden')}</>
                          )}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/products/${p.id}`)}>
                            <Eye className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(p.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SimplePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('products.name')}</Label>
            <Input className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('products.description')}</Label>
            <Input className="h-9" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('products.price')}</Label>
            <Input className="h-9" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('products.category')}</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t('products.filterByCategory')} /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('products.brand')}</Label>
              <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t('products.filterByBrand')} /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t('products.deleteProduct')}
        description={t('products.confirmDelete')}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
