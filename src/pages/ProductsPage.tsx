import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, MoreHorizontal, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { ConfirmDialog, SimplePagination, TableSkeleton, EmptyState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 6;

// دالة مساعدة لاستخراج الاسم متعدد اللغات
const getLocalizedValue = (data: any, lang: string = 'ar') => {
  if (!data) return '';
  if (typeof data === 'object') return data[lang] || data.ar || data.en || '';
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') return parsed[lang] || parsed.ar || parsed.en || '';
    } catch (e) {}
    return data;
  }
  return '';
};

// دالة لتحويل الحقول القادمة من الباك إند إلى كائن للغات
const parseI18n = (field: any) => {
  if (!field) return { ar: '', en: '', ku: '' };
  if (typeof field === 'object') return { ar: field.ar || '', en: field.en || '', ku: field.ku || '' };
  if (typeof field === 'string') {
    try {
      const p = JSON.parse(field);
      if (p && typeof p === 'object') return { ar: p.ar || '', en: p.en || '', ku: p.ku || '' };
    } catch(e) {}
    return { ar: field, en: '', ku: '' };
  }
  return { ar: '', en: '', ku: '' };
};

// دالة لتحويل مصفوفات JSON القادمة من الباك إند
const parseArray = (field: any) => {
  if (!field) return [];
  if (Array.isArray(field)) return field.map(item => parseI18n(item));
  if (typeof field === 'string') {
    try {
      const p = JSON.parse(field);
      if (Array.isArray(p)) return p.map(item => parseI18n(item));
    } catch(e) {}
  }
  return [];
};

// دالة لتحويل المميزات الواردة إلى شكل مفهوم للنموذج
const parseFeatureArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === 'string') {
    try { arr = JSON.parse(field); } catch(e) { return []; }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any) => parseI18n(item.feature_text || item.feature || item));
};

// دالة لتحويل المواصفات الواردة إلى شكل (مجموعة، مفتاح، وقيمة) للنموذج
const parseSpecArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === 'string') {
    try { arr = JSON.parse(field); } catch(e) { return []; }
  }

  const result: any[] = [];
  
  // إذا كانت المواصفات قادمة من الـ API مجمعة كـ Object (بناءً على groupBy في Resource)
  if (typeof arr === 'object' && !Array.isArray(arr) && arr !== null) {
    Object.entries(arr).forEach(([groupName, specs]: [string, any]) => {
      if (Array.isArray(specs)) {
        specs.forEach(spec => {
          result.push({
            group_name: parseI18n(groupName),
            spec_key: parseI18n(spec.key || spec.spec_key || spec.name),
            spec_value: parseI18n(spec.value || spec.spec_value)
          });
        });
      }
    });
  } 
  // إذا كانت قادمة كمصفوفة عادية (كإجراء احتياطي)
  else if (Array.isArray(arr)) {
    arr.forEach(item => {
      result.push({
        group_name: parseI18n(item.group_name),
        spec_key: parseI18n(item.key || item.spec_key || item.name),
        spec_value: parseI18n(item.value || item.spec_value)
      });
    });
  }
  return result;
};

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { products, setProducts, categories, setCategories, brands, setBrands } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'specs' | 'images'>('basic');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    nameAr: '', nameEn: '', nameKu: '',
    descAr: '', descEn: '', descKu: '',
    categoryId: '', brandId: '',
    modelNumber: '', originCountry: '',
    price: '',
    isActive: true,
    features: [] as {ar: string, en: string, ku: string}[],
    specifications: [] as { group_name: {ar: string, en: string, ku: string}, spec_key: {ar: string, en: string, ku: string}, spec_value: {ar: string, en: string, ku: string} }[],
    images: [] as File[]
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/products", { headers }),
        fetch("http://127.0.0.1:8000/api/categories", { headers }),
        fetch("http://127.0.0.1:8000/api/brands", { headers })
      ]);
      const [prodData, catData, brandData] = await Promise.all([
        prodRes.json(), catRes.json(), brandRes.json()
      ]);
      const productsArray = prodData.data?.data || prodData.data || [];
      setProducts(Array.isArray(productsArray) ? productsArray : []);
      if (catData.status || catData.data) setCategories(catData.data || []);
      if (brandData.status || brandData.data) setBrands(brandData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const pName = getLocalizedValue(p.name, i18n.language).toLowerCase();
      const matchSearch = pName.includes(search.toLowerCase());
      const matchCategory = filterCategory === 'all' || String(p.category?.id || p.category_id || p.categoryId) === filterCategory;
      const matchBrand = filterBrand === 'all' || String(p.brand?.id || p.brand_id || p.brandId) === filterBrand;
      return matchSearch && matchCategory && matchBrand;
    });
  }, [products, search, filterCategory, filterBrand, i18n.language]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({
      nameAr: '', nameEn: '', nameKu: '',
      descAr: '', descEn: '', descKu: '',
      categoryId: '', brandId: '',
      modelNumber: '', originCountry: '',
      price: '',
      isActive: true,
      features: [], specifications: [], images: []
    });
    setModalOpen(true);
    setActiveTab('basic');
  };

  const openEdit = async (p: any) => {
    setEditingProduct(p);
    const name = parseI18n(p.name);
    const desc = parseI18n(p.description);
    setForm({
      nameAr: name.ar, nameEn: name.en, nameKu: name.ku,
      descAr: desc.ar, descEn: desc.en, descKu: desc.ku,
      categoryId: String(p.category?.id || p.category_id || p.categoryId || ''),
      brandId: String(p.brand?.id || p.brand_id || p.brandId || ''),
      modelNumber: p.model_number || p.modelNumber || '',
      originCountry: p.origin_country || p.originCountry || '',
      price: p.price !== null && p.price !== undefined ? String(p.price) : '',
      isActive: p.is_active !== undefined ? !!p.is_active : true,
      features: parseFeatureArray(p.features),
      specifications: parseSpecArray(p.specifications),
      images: [] // سيتم إرسال الصور الجديدة فقط
    });
    setModalOpen(true);
    setActiveTab('basic');

    // جلب بيانات المنتج بالكامل للتأكد من الحصول على اللغات الثلاث والمواصفات
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/products/${p.id}`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const json = await res.json();
      if (json.status && json.data) {
        const full = json.data;
        const fname = parseI18n(full.name);
        const fdesc = parseI18n(full.description);
        setForm(prev => ({
          ...prev,
          nameAr: fname.ar || prev.nameAr, nameEn: fname.en || prev.nameEn, nameKu: fname.ku || prev.nameKu,
          descAr: fdesc.ar || prev.descAr, descEn: fdesc.en || prev.descEn, descKu: fdesc.ku || prev.descKu,
          categoryId: String(full.category?.id || full.category_id || prev.categoryId),
          brandId: String(full.brand?.id || full.brand_id || prev.brandId),
          modelNumber: full.model_number || prev.modelNumber,
          originCountry: full.origin_country || prev.originCountry,
          price: full.price !== null && full.price !== undefined ? String(full.price) : prev.price,
          isActive: full.is_active !== undefined ? !!full.is_active : prev.isActive,
          features: parseFeatureArray(full.features),
          specifications: parseSpecArray(full.specifications),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();

      formData.append("name[ar]", form.nameAr);
      formData.append("name[en]", form.nameEn);
      formData.append("name[ku]", form.nameKu);
      formData.append("description[ar]", form.descAr);
      formData.append("description[en]", form.descEn);
      formData.append("description[ku]", form.descKu);
      
      if (form.categoryId) formData.append("category_id", form.categoryId);
      if (form.brandId) formData.append("brand_id", form.brandId);
      
      formData.append("model_number", form.modelNumber);
      formData.append("origin_country", form.originCountry);
      if (form.price) formData.append("price", form.price);
      formData.append("is_active", form.isActive ? "1" : "0");

      form.images.forEach((file) => formData.append("images[]", file));

      // إرسال المميزات بالمفاتيح الدقيقة لحل خطأ (feature_text)
      const formattedFeatures = form.features.map(f => ({
        feature_text: f, // ما يتوقعه قاعدة البيانات في Laravel
        feature: f       // إرساله كاحتياط ليتوافق مع جميع الحالات
      }));
      formData.append("features", JSON.stringify(formattedFeatures));

      // إرسال المواصفات بالأسماء الدقيقة لأعمدة قاعدة البيانات في Laravel
      const formattedSpecs = form.specifications.map(s => ({
        group_name: s.group_name,
        spec_key: s.spec_key,
        spec_value: s.spec_value
      }));
      formData.append("specifications", JSON.stringify(formattedSpecs));

      const url = editingProduct
        ? `http://127.0.0.1:8000/api/products/${editingProduct.id}`
        : "http://127.0.0.1:8000/api/products";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        body: formData,
      });

      const data = await res.json();
      if (data.status || res.ok) {
        toast.success(editingProduct ? t('products.productUpdated') : t('products.productAdded'));
        setModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'حدث خطأ أثناء حفظ المنتج');
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
        const res = await fetch(`http://127.0.0.1:8000/api/products/${deleteId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        if (res.ok) {
          toast.success(t('products.productDeleted'));
          fetchData();
        } else {
          toast.error('فشل حذف المنتج');
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
              <SelectItem key={c.id} value={String(c.id)}>{getLocalizedValue(c.name, i18n.language) || 'بدون اسم'}</SelectItem>
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
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
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
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">الموديل / المنشأ</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">الحالة</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={8} rows={5} />
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8}><EmptyState message={t('common.noResults')} /></td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      {p.image || (p.images && p.images.length > 0) ? (
                        <img src={p.image || p.images[0].url || p.images[0]} alt="product" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/products/${p.id}`)} className="font-medium hover:text-primary transition-colors text-start text-sm">
                        {getLocalizedValue(p.name, i18n.language) || 'بدون اسم'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{p.brand?.name || brands.find(b => String(b.id) === String(p.brand?.id || p.brand_id || p.brandId))?.name || 'غير محدد'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{getLocalizedValue(p.category?.name || categories.find(c => String(c.id) === String(p.category?.id || p.category_id || p.categoryId))?.name, i18n.language) || 'غير محدد'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{p.model_number || '-'}</div>
                      <div className="text-xs text-muted-foreground">{p.origin_country || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? "default" : "secondary"} className={p.is_active ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground"}>
                        {p.is_active ? 'ظاهر' : 'مخفي'}
                      </Badge>
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

      {/* Add/Edit Modal المخصص الواسع */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20">
            <DialogTitle className="text-xl">{editingProduct ? t('products.editProduct') : t('products.addProduct')}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">أدخل تفاصيل وبيانات المنتج بدقة.</DialogDescription>
            
            {/* Tabs Selector */}
            <div className="flex gap-4 pt-4">
              {[
                { id: 'basic', label: 'الأساسية' },
                { id: 'details', label: 'التفاصيل' },
                { id: 'specs', label: 'المواصفات والمميزات' },
                { id: 'images', label: 'الصور' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`px-1 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto flex-1">
            {/* تبويب: المعلومات الأساسية */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label>الاسم (عربي) *</Label><Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>الاسم (إنجليزي) *</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>الاسم (كردي) *</Label><Input value={form.nameKu} onChange={(e) => setForm({ ...form, nameKu: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>السعر ($)</Label>
                    <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>القسم *</Label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{getLocalizedValue(c.name, i18n.language) || 'بدون اسم'}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>العلامة التجارية *</Label>
                    <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر العلامة التجارية" /></SelectTrigger>
                      <SelectContent>{brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 bg-muted/20 p-3 rounded-lg border">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    className="w-4 h-4 cursor-pointer accent-primary" 
                    checked={form.isActive} 
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                  />
                  <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
                    إظهار المنتج (تفعيل)
                  </Label>
                  <span className="text-xs text-muted-foreground ltr:ml-auto rtl:mr-auto">
                    {form.isActive ? 'المنتج سيظهر للعملاء في المتجر' : 'المنتج سيكون مخفياً عن العملاء'}
                  </span>
                </div>
              </div>
            )}

            {/* تبويب: التفاصيل */}
            {activeTab === 'details' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>رقم الموديل</Label><Input value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>بلد المنشأ</Label><Input value={form.originCountry} onChange={(e) => setForm({ ...form, originCountry: e.target.value })} /></div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>الوصف (عربي)</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={form.descAr} onChange={(e) => setForm({ ...form, descAr: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>الوصف (إنجليزي)</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>الوصف (كردي)</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={form.descKu} onChange={(e) => setForm({ ...form, descKu: e.target.value })} /></div>
                </div>
              </div>
            )}

            {/* تبويب: المواصفات والمميزات */}
            {activeTab === 'specs' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><Label className="text-base font-bold">المميزات (Features)</Label><Button variant="outline" size="sm" onClick={() => setForm({...form, features: [...form.features, {ar:'', en:'', ku:''}]})}><Plus className="h-4 w-4 ml-1" /> إضافة ميزة</Button></div>
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border">
                      <Input placeholder="عربي" value={f.ar} onChange={(e) => { const n = [...form.features]; n[i].ar = e.target.value; setForm({...form, features: n}); }} />
                      <Input placeholder="English" value={f.en} onChange={(e) => { const n = [...form.features]; n[i].en = e.target.value; setForm({...form, features: n}); }} />
                      <Input placeholder="کوردی" value={f.ku} onChange={(e) => { const n = [...form.features]; n[i].ku = e.target.value; setForm({...form, features: n}); }} />
                      <Button variant="destructive" size="icon" onClick={() => { const n = [...form.features]; n.splice(i, 1); setForm({...form, features: n}); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><Label className="text-base font-bold">المواصفات (Specifications)</Label><Button variant="outline" size="sm" onClick={() => setForm({...form, specifications: [...form.specifications, {group_name:{ar:'',en:'',ku:''}, spec_key:{ar:'',en:'',ku:''}, spec_value:{ar:'',en:'',ku:''}}]})}><Plus className="h-4 w-4 ml-1" /> إضافة مواصفة</Button></div>
                  {form.specifications.map((s, i) => (
                    <div key={i} className="flex flex-col gap-2 bg-muted/20 p-3 rounded-lg border relative">
                      <Button variant="destructive" size="icon" className="absolute top-2 left-2 h-7 w-7" onClick={() => { const n = [...form.specifications]; n.splice(i, 1); setForm({...form, specifications: n}); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <div className="flex items-center gap-2 pl-10">
                        <span className="text-xs font-bold w-12 shrink-0">المجموعة:</span>
                        <Input placeholder="عربي" value={s.group_name.ar} onChange={(e) => { const n = [...form.specifications]; n[i].group_name.ar = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="English" value={s.group_name.en} onChange={(e) => { const n = [...form.specifications]; n[i].group_name.en = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="کوردی" value={s.group_name.ku} onChange={(e) => { const n = [...form.specifications]; n[i].group_name.ku = e.target.value; setForm({...form, specifications: n}); }} />
                      </div>
                      <div className="flex items-center gap-2 pl-10">
                        <span className="text-xs font-bold w-12 shrink-0">الاسم:</span>
                        <Input placeholder="عربي" value={s.spec_key.ar} onChange={(e) => { const n = [...form.specifications]; n[i].spec_key.ar = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="English" value={s.spec_key.en} onChange={(e) => { const n = [...form.specifications]; n[i].spec_key.en = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="کوردی" value={s.spec_key.ku} onChange={(e) => { const n = [...form.specifications]; n[i].spec_key.ku = e.target.value; setForm({...form, specifications: n}); }} />
                      </div>
                      <div className="flex items-center gap-2 pl-10">
                        <span className="text-xs font-bold w-12 shrink-0">القيمة:</span>
                        <Input placeholder="عربي" value={s.spec_value.ar} onChange={(e) => { const n = [...form.specifications]; n[i].spec_value.ar = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="English" value={s.spec_value.en} onChange={(e) => { const n = [...form.specifications]; n[i].spec_value.en = e.target.value; setForm({...form, specifications: n}); }} />
                        <Input placeholder="کوردی" value={s.spec_value.ku} onChange={(e) => { const n = [...form.specifications]; n[i].spec_value.ku = e.target.value; setForm({...form, specifications: n}); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب: الصور */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <Label className="text-base font-bold">صور المنتج</Label>
                <p className="text-xs text-muted-foreground">يمكنك تحديد عدة صور دفعة واحدة. سيتم إرسالها كحزمة إلى الخادم.</p>
                <Input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setForm({...form, images: Array.from(e.target.files)})} className="cursor-pointer" />
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 bg-muted/20 p-4 rounded-xl border">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(img)} alt="preview" className="h-20 w-20 object-cover rounded-lg border shadow-sm" />
                        <button type="button" onClick={() => { const n = [...form.images]; n.splice(i, 1); setForm({...form, images: n}); }} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t bg-muted/10 gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
