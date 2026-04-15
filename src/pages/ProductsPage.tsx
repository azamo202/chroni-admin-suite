import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { productService } from '@/services/api';
import { FormModal, ConfirmDialog, SimplePagination, TableSkeleton, EmptyState } from '@/components/shared';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t('products.title')}</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('products.addProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            placeholder={t('products.searchByName')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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
      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start p-3 font-medium">{t('products.image')}</th>
              <th className="text-start p-3 font-medium">{t('products.name')}</th>
              <th className="text-start p-3 font-medium">{t('products.brand')}</th>
              <th className="text-start p-3 font-medium">{t('products.category')}</th>
              <th className="text-start p-3 font-medium">{t('products.price')}</th>
              <th className="text-start p-3 font-medium">{t('products.status')}</th>
              <th className="text-start p-3 font-medium">{t('products.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={7} rows={5} />
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7}><EmptyState message={t('common.noResults')} /></td></tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  </td>
                  <td className="p-3 font-medium">
                    <button onClick={() => navigate(`/products/${p.id}`)} className="hover:text-primary transition-colors text-start">
                      {p.name}
                    </button>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.brand}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3">${p.price.toFixed(2)}</td>
                  <td className="p-3">
                    <Badge variant={p.status === 'visible' ? 'default' : 'secondary'}>
                      {p.status === 'visible' ? t('products.visible') : t('products.hidden')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/products/${p.id}`)}>
                          <Eye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(p.id)}>
                          {p.status === 'visible' ? <EyeOff className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> : <Eye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
                          {p.status === 'visible' ? t('products.hidden') : t('products.visible')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(p.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t('common.delete')}
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

      <SimplePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <div>
            <Label>{t('products.name')}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{t('products.description')}</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>{t('products.price')}</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <Label>{t('products.category')}</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder={t('products.filterByCategory')} /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('products.brand')}</Label>
            <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
              <SelectTrigger><SelectValue placeholder={t('products.filterByBrand')} /></SelectTrigger>
              <SelectContent>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
