import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  X,
  ChevronDown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";
import {
  ConfirmDialog,
  SimplePagination,
  TableSkeleton,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

// --- دوال مساعدة (Pure Functions) ---
const getLocalizedValue = (data: any, lang: string = "ar") => {
  if (!data) return "";
  if (typeof data === "object") return data[lang] || data.ar || data.en || "";
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object")
        return parsed[lang] || parsed.ar || parsed.en || "";
    } catch (e) {}
    return data;
  }
  return "";
};

const parseI18n = (field: any) => {
  if (!field) return { ar: "", en: "", ku: "" };
  if (typeof field === "object")
    return { ar: field.ar || "", en: field.en || "", ku: field.ku || "" };
  if (typeof field === "string") {
    try {
      const p = JSON.parse(field);
      if (p && typeof p === "object")
        return { ar: p.ar || "", en: p.en || "", ku: p.ku || "" };
    } catch (e) {}
    return { ar: field, en: "", ku: "" };
  }
  return { ar: "", en: "", ku: "" };
};

const parseFeatureArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === "string") {
    try {
      arr = JSON.parse(field);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any) =>
    parseI18n(item.feature_text || item.feature || item),
  );
};

const parseSpecArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === "string") {
    try {
      arr = JSON.parse(field);
    } catch (e) {
      return [];
    }
  }
  const result: any[] = [];
  if (typeof arr === "object" && !Array.isArray(arr) && arr !== null) {
    Object.entries(arr).forEach(([groupName, specs]: [string, any]) => {
      if (Array.isArray(specs)) {
        specs.forEach((spec) => {
          result.push({
            group_name: parseI18n(groupName),
            spec_key: parseI18n(spec.key || spec.spec_key || spec.name),
            spec_value: parseI18n(spec.value || spec.spec_value),
          });
        });
      }
    });
  } else if (Array.isArray(arr)) {
    arr.forEach((item) => {
      result.push({
        group_name: parseI18n(item.group_name),
        spec_key: parseI18n(item.key || item.spec_key || item.name),
        spec_value: parseI18n(item.value || item.spec_value),
      });
    });
  }
  return result;
};

// --- دالة مساعدة لاستخراج مسار القسم كاملاً (مثال: القسم الرئيسي / القسم الفرعي) ---
const getCategoryPath = (categoryId: any, categories: any[], lang: string, t: any): string => {
  if (!categoryId || !categories || !Array.isArray(categories)) return "";
  let path: string[] = [];
  const target = String(categoryId);

  const find = (cats: any[], current: any[]): boolean => {
    for (const cat of cats) {
      const next = [...current, cat];
      if (String(cat.id) === target) {
        path = next.map((c) => getLocalizedValue(c.name, lang) || t("common.unnamed", "بدون اسم"));
        return true;
      }
      if (cat.children && Array.isArray(cat.children)) {
        if (find(cat.children, next)) return true;
      }
    }
    return false;
  };

  find(categories, []);
  return path.join(" / ");
};

// --- مكون مخصص لاختيار القسم بشكل شجري (Tree Select) باستخدام DropdownMenu ---
const CategoryTreeSelect = ({ categories, value, onChange, placeholder, i18n, t, disabled = false, showAllOption = true }: any) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const flatten = (cats: any[]): any[] => cats.reduce((acc, cat) => acc.concat(cat, flatten(cat.children || [])), []);
  const allCats = flatten(categories || []);
  const selectedCat = allCats.find(c => String(c.id) === String(value));
  const selectedName = selectedCat ? getLocalizedValue(selectedCat.name, i18n.language) : placeholder;

  const renderCategories = (cats: any[], level = 0) => {
    return cats.map(cat => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded[cat.id];
      const isSelected = String(cat.id) === String(value);

      return (
        <div key={cat.id} className="flex flex-col w-full">
          <div 
            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-gray-700'}`}
            style={{ paddingRight: level === 0 ? '0.5rem' : `${level * 1.5 + 0.5}rem` }}
            onClick={() => handleSelect(String(cat.id))}
          >
            <span className="flex-1 text-right truncate">{getLocalizedValue(cat.name, i18n.language) || t("common.unnamed", "بدون اسم")}</span>
            {hasChildren && (
              <div 
                className="p-1 rounded hover:bg-gray-200 text-gray-500 mr-2 flex items-center justify-center transition-colors"
                onClick={(e) => toggleExpand(e, cat.id)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-0' : 'rotate-90'}`} />
              </div>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="flex flex-col border-r-2 border-muted/30 mr-3">
              {renderCategories(cat.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" className={`w-full justify-between font-normal bg-white h-9 px-3 ${disabled ? 'opacity-50' : 'shadow-sm'}`}>
          <span className="truncate">{value === 'all' || !value ? placeholder : selectedName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-y-auto p-0 z-50" style={{ width: 'var(--radix-dropdown-menu-trigger-width)', minWidth: '220px' }} align="start">
        {showAllOption && (
          <div className={`px-3 py-2.5 text-sm cursor-pointer transition-colors border-b ${value === 'all' || !value ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-muted text-gray-700'}`} onClick={() => handleSelect('all')}>
            {t("products.all", "الكل")}
          </div>
        )}
        <div className="py-1">{renderCategories(categories || [])}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- المكون الرئيسي ---
export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // استدعاء المتجر
  const {
    products,
    categories,
    brands,
    loading,
    totalPages,
    fetchData,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProductStore();

  // حالات واجهة المستخدم
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [sort, setSort] = useState("latest");

  const debouncedMinPrice = useDebounce(minPrice, 300);
  const debouncedMaxPrice = useDebounce(maxPrice, 300);
  const debouncedModelNumber = useDebounce(modelNumber, 300);

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "specs" | "images"
  >("basic");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة النموذج
  const initialFormState = {
    nameAr: "",
    nameEn: "",
    nameKu: "",
    descAr: "",
    descEn: "",
    descKu: "",
    categoryId: "",
    brandId: "",
    modelNumber: "",
    originCountry: "",
    price: "",
    isActive: true,
    features: [] as any[],
    specifications: [] as any[],
    images: [] as File[],
  };
  const [form, setForm] = useState(initialFormState);

  // التحكم في دورة حياة الجلب باستخدام React Query
  useQuery({
    queryKey: [
      "products-data-list",
      page,
      debouncedSearch,
      filterCategory,
      filterBrand,
      debouncedMinPrice,
      debouncedMaxPrice,
      debouncedModelNumber,
      sort,
      filterStatus,
    ],
    queryFn: async () => {
      // إرسال category_slug كما يتوقعه الباك اند أو إرسال id كبديل أمان
      const flatten = (cats: any[]): any[] => cats.reduce((acc, cat) => acc.concat(cat, flatten(cat.children || [])), []);
      const allCats = flatten(categories || []);
      const selectedCat = allCats.find((c) => String(c.id) === filterCategory);
      const category_slug = selectedCat?.slug || filterCategory;

      await fetchData({
        page,
        search: debouncedSearch,
        category_id: filterCategory,
        category_slug: category_slug,
        brand_id: filterBrand,
        min_price: debouncedMinPrice,
        max_price: debouncedMaxPrice,
        model_number: debouncedModelNumber,
        sort,
        is_active: filterStatus,
      });
      return true;
    },
    staleTime: 5000,
  });

  const paginated = products;

  const openAdd = () => {
    setEditingProduct(null);
    setForm(initialFormState);
    setModalOpen(true);
    setActiveTab("basic");
  };

  const openEdit = async (p: any) => {
    setEditingProduct(p);
    const name = parseI18n(p.name);
    const desc = parseI18n(p.description);

    setForm({
      nameAr: name.ar,
      nameEn: name.en,
      nameKu: name.ku,
      descAr: desc.ar,
      descEn: desc.en,
      descKu: desc.ku,
      categoryId: String(p.category?.id || p.category_id || p.categoryId || ""),
      brandId: String(p.brand?.id || p.brand_id || p.brandId || ""),
      modelNumber: p.model_number || p.modelNumber || "",
      originCountry: p.origin_country || p.originCountry || "",
      price: p.price !== null && p.price !== undefined ? String(p.price) : "",
      isActive: p.is_active !== undefined ? !!Number(p.is_active) : true,
      features: parseFeatureArray(p.features),
      specifications: parseSpecArray(p.specifications),
      images: [], // الصور القديمة تظهر في الداشبورد، هنا نرفع الجديد فقط
    });

    setModalOpen(true);
    setActiveTab("basic");

    // جلب التفاصيل الكاملة لتعبئة اللغات بشكل دقيق
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/products/${p.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (json.status && json.data) {
        const full = json.data;
        const fname = parseI18n(full.name);
        const fdesc = parseI18n(full.description);
        setForm((prev) => ({
          ...prev,
          nameAr: fname.ar || prev.nameAr,
          nameEn: fname.en || prev.nameEn,
          nameKu: fname.ku || prev.nameKu,
          descAr: fdesc.ar || prev.descAr,
          descEn: fdesc.en || prev.descEn,
          descKu: fdesc.ku || prev.descKu,
          features: parseFeatureArray(full.features),
          specifications: parseSpecArray(full.specifications),
        }));
      }
    } catch (err) {
      console.error("Fetch Single Product Error", err);
    }
  };

  // التقاط حالة التعديل القادمة من صفحة تفاصيل المنتج لفتح النافذة تلقائياً
  useEffect(() => {
    if (location.state?.editProduct) {
      setTimeout(() => {
        openEdit(location.state.editProduct);
        window.history.replaceState({}, document.title); // مسح الحالة حتى لا تُفتح النافذة مجدداً عند تحديث الصفحة (Refresh)
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.editProduct]);

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      toast.error(t("products.nameArRequired", "الاسم باللغة العربية مطلوب"));
      return;
    }

    setIsSubmitting(true);
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

    // معالجة المصفوفات المعقدة
    const formattedFeatures = form.features.map((f) => ({
      feature_text: f,
      feature: f,
    }));
    formData.append("features", JSON.stringify(formattedFeatures));

    const formattedSpecs = form.specifications.map((s) => ({
      group_name: s.group_name,
      spec_key: s.spec_key,
      spec_value: s.spec_value,
    }));
    formData.append("specifications", JSON.stringify(formattedSpecs));

    // استدعاء دالة المتجر
    const response = editingProduct
      ? await updateProduct(editingProduct.id, formData)
      : await createProduct(formData);

    if (response.success) {
      toast.success(
        editingProduct
          ? t("products.productUpdated")
          : t("products.productAdded"),
      );
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products-data-list"] });
    } else {
      toast.error(response.message);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const response = await deleteProduct(deleteId);

    if (response.success) {
      toast.success(t("products.productDeleted"));
      queryClient.invalidateQueries({ queryKey: ["products-data-list"] });
      // إذا كانت الصفحة الحالية فارغة بعد الحذف، نعود للصفحة السابقة
      if (paginated.length === 1 && page > 1) setPage(page - 1);
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title={t("products.title")}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t("products.addProduct")}
          </Button>
        }
      />

      {/* الفلاتر (Filters) */}
      <div className="bg-card border rounded-xl p-4 shadow-sm mb-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm text-gray-800">
            {t("products.advancedSearch", "البحث والفلترة المتقدمة")}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              placeholder={t("products.searchByName")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ltr:pl-9 rtl:pr-9 h-9 text-sm bg-white"
            />
          </div>
          <Input
            placeholder={t("products.searchModel", "بحث برقم الموديل...")}
            value={modelNumber}
            onChange={(e) => {
              setModelNumber(e.target.value);
              setPage(1);
            }}
            className="h-9 text-sm bg-white"
          />
                    <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-sm bg-white">
              <SelectValue placeholder={t("products.statusFilter", "حالة المنتج")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.allStatuses", "جميع الحالات")}</SelectItem>
              <SelectItem value="1">{t("products.active", "مفعل (معروض)")}</SelectItem>
              <SelectItem value="0">{t("products.hidden", "مخفي")}</SelectItem>
            </SelectContent>
          </Select>
          <CategoryTreeSelect
            categories={categories}
            value={filterCategory}
            onChange={(v: string) => { setFilterCategory(v); setPage(1); }}
            placeholder={t("products.filterByCategory")}
            i18n={i18n}
            t={t}
            showAllOption={true}
          />
          <Select
            value={filterBrand}
            onValueChange={(v) => {
              setFilterBrand(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-sm bg-white">
              <SelectValue placeholder={t("products.filterByBrand")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.all")}</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
            onClick={() => {
              setSearch("");
              setModelNumber("");
              setFilterCategory("all");
              setFilterBrand("all");
              setFilterStatus("all");
              setMinPrice("");
              setMaxPrice("");
              setSort("latest");
              setPage(1);
            }}
          >
            <X className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {t("products.clearFilters", "مسح الفلاتر")}
          </Button>
        </div>
      </div>

      {/* أزرار التنقل بين الصفحات (Pagination) */}
      <div className="mb-4">
        <SimplePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* الجدول (Table) */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.image")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.brand")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.category")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.modelOrigin", "الموديل / المنشأ")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.status", "الحالة")}
                </th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={7} rows={5} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message={t("common.noResults")} />
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {p.image || (p.images && p.images.length > 0) ? (
                        <img
                          src={p.image || p.images[0].url || p.images[0]}
                          alt="product"
                          className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="font-medium hover:text-primary transition-colors text-start text-sm"
                      >
                        {getLocalizedValue(p.name, i18n.language) || t("common.unnamed", "بدون اسم")}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {p.brand?.name ||
                        brands.find(
                          (b) =>
                            String(b.id) ===
                            String(p.brand?.id || p.brand_id || p.brandId),
                        )?.name ||
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {getCategoryPath(
                        p.category?.id || p.category_id || p.categoryId,
                        categories,
                        i18n.language,
                        t
                      ) ||
                        getLocalizedValue(p.category?.name, i18n.language) ||
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800">
                        {p.model_number || "-"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.origin_country || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={Number(p.is_active) ? "default" : "secondary"}
                        className={
                          Number(p.is_active)
                            ? "bg-green-50 text-green-700 border-0"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                    {Number(p.is_active) ? t("common.active", "مفعل") : t("common.inactive", "مخفي")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => navigate(`/products/${p.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                            {t("common.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(p.id)}
                            className="text-destructive focus:bg-red-50 focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                            {t("common.delete")}
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

      {/* نافذة الإضافة/التعديل (Modal) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20">
            <DialogTitle className="text-xl">
              {editingProduct
                ? t("products.editProduct")
                : t("products.addProduct")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("products.modalDesc", "أدخل تفاصيل وبيانات المنتج بدقة.")}
            </DialogDescription>

            {/* أزرار التبويبات داخل النافذة */}
            <div className="flex gap-4 pt-4 border-b">
              {[
                { id: "basic", label: t("products.tabBasic", "الأساسية") },
                { id: "details", label: t("products.tabDetails", "التفاصيل") },
                { id: "specs", label: t("products.tabSpecs", "المواصفات والمميزات") },
                { id: "images", label: t("products.tabImages", "الصور") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`px-1 py-2 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
            {/* التبويب الأول: الأساسية */}
            {activeTab === "basic" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.nameAr", "الاسم (عربي) *")}
                    </Label>
                    <Input
                      value={form.nameAr}
                      onChange={(e) =>
                        setForm({ ...form, nameAr: e.target.value })
                      }
                      className="bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.nameEn", "الاسم (إنجليزي)")}
                    </Label>
                    <Input
                      value={form.nameEn}
                      onChange={(e) =>
                        setForm({ ...form, nameEn: e.target.value })
                      }
                      dir="ltr"
                      className="text-left bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.nameKu", "الاسم (كردي)")}
                    </Label>
                    <Input
                      value={form.nameKu}
                      onChange={(e) =>
                        setForm({ ...form, nameKu: e.target.value })
                      }
                      dir="ltr"
                      className="text-left bg-white shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("products.priceLabel", "السعر ($)")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      className="bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("products.categoryLabel", "القسم *")}</Label>
                    <CategoryTreeSelect
                      categories={categories}
                      value={form.categoryId}
                      onChange={(v: string) => setForm({ ...form, categoryId: v })}
                      placeholder={t("products.selectCategory", "اختر القسم")}
                      i18n={i18n}
                      t={t}
                      showAllOption={false}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.brandLabel", "العلامة التجارية *")}
                    </Label>
                    <Select
                      value={form.brandId}
                      onValueChange={(v) => setForm({ ...form, brandId: v })}
                    >
                      <SelectTrigger className="bg-white shadow-sm">
                        <SelectValue placeholder={t("products.selectBrand", "اختر العلامة التجارية")} />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 bg-white p-4 rounded-xl border shadow-sm">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-4 h-4 cursor-pointer accent-primary"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  <Label
                    htmlFor="is_active"
                    className="cursor-pointer text-sm font-bold text-gray-800"
                  >
                      {t("products.showProduct", "إظهار المنتج (تفعيل)")}
                  </Label>
                  <span className="text-xs text-muted-foreground ltr:ml-auto rtl:mr-auto bg-gray-100 px-2 py-1 rounded">
                    {form.isActive
                        ? t("products.showProductDesc", "المنتج سيظهر للعملاء في المتجر")
                        : t("products.hideProductDesc", "المنتج سيكون مخفياً عن العملاء")}
                  </span>
                </div>
              </div>
            )}

            {/* التبويب الثاني: التفاصيل */}
            {activeTab === "details" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.modelNumberLabel", "رقم الموديل (Model Number)")}
                    </Label>
                    <Input
                      value={form.modelNumber}
                      onChange={(e) =>
                        setForm({ ...form, modelNumber: e.target.value })
                      }
                      className="bg-white uppercase shadow-sm"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.originCountryLabel", "بلد المنشأ (Origin Country)")}
                    </Label>
                    <Input
                      value={form.originCountry}
                      onChange={(e) =>
                        setForm({ ...form, originCountry: e.target.value })
                      }
                      className="bg-white shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.descAr", "الوصف (عربي)")}
                    </Label>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={form.descAr}
                      onChange={(e) =>
                        setForm({ ...form, descAr: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.descEn", "الوصف (إنجليزي)")}
                    </Label>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-left"
                      dir="ltr"
                      value={form.descEn}
                      onChange={(e) =>
                        setForm({ ...form, descEn: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {t("products.descKu", "الوصف (كردي)")}
                    </Label>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-left"
                      dir="ltr"
                      value={form.descKu}
                      onChange={(e) =>
                        setForm({ ...form, descKu: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* التبويب الثالث: المواصفات والمميزات */}
            {activeTab === "specs" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* المميزات */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border">
                    <Label className="text-sm font-bold text-gray-800">
                        {t("products.featuresTitle", "المميزات السريعة (Features)")}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white h-8"
                      onClick={() =>
                        setForm({
                          ...form,
                          features: [
                            ...form.features,
                            { ar: "", en: "", ku: "" },
                          ],
                        })
                      }
                    >
                        <Plus className="h-3.5 w-3.5 ml-1" /> {t("products.addFeature", "إضافة ميزة")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.features.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                          {t("products.noFeatures", "لم يتم إضافة أي ميزات بعد")}
                      </div>
                    )}
                    {form.features.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm group"
                      >
                        <Input
                          placeholder={t("products.arabic", "عربي")}
                          value={f.ar}
                          onChange={(e) => {
                            const n = [...form.features];
                            n[i] = { ...n[i], ar: e.target.value };
                            setForm({ ...form, features: n });
                          }}
                        />
                        <Input
                          placeholder={t("products.english", "English")}
                          dir="ltr"
                          value={f.en}
                          onChange={(e) => {
                            const n = [...form.features];
                            n[i] = { ...n[i], en: e.target.value };
                            setForm({ ...form, features: n });
                          }}
                        />
                        <Input
                          placeholder={t("products.kurdish", "کوردی")}
                          dir="ltr"
                          value={f.ku}
                          onChange={(e) => {
                            const n = [...form.features];
                            n[i] = { ...n[i], ku: e.target.value };
                            setForm({ ...form, features: n });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => {
                            const n = [...form.features];
                            n.splice(i, 1);
                            setForm({ ...form, features: n });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* المواصفات الفنية */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border">
                    <Label className="text-sm font-bold text-gray-800">
                        {t("products.specsTitle", "المواصفات الفنية (Specifications)")}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white h-8"
                      onClick={() =>
                        setForm({
                          ...form,
                          specifications: [
                            ...form.specifications,
                            {
                              group_name: { ar: "", en: "", ku: "" },
                              spec_key: { ar: "", en: "", ku: "" },
                              spec_value: { ar: "", en: "", ku: "" },
                            },
                          ],
                        })
                      }
                    >
                        <Plus className="h-3.5 w-3.5 ml-1" /> {t("products.addSpec", "إضافة مواصفة")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.specifications.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                          {t("products.noSpecs", "لم يتم إضافة أي مواصفات فنية بعد")}
                      </div>
                    )}
                    {form.specifications.map((s, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-3 bg-white p-4 rounded-xl border shadow-sm relative"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 left-2 text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                          onClick={() => {
                            const n = [...form.specifications];
                            n.splice(i, 1);
                            setForm({ ...form, specifications: n });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3 pl-12">
                          <span className="text-xs font-bold text-gray-500 w-16 shrink-0 bg-gray-50 px-2 py-1 rounded text-center border">
                            {t("products.specGroup", "المجموعة")}
                          </span>
                          <Input
                            placeholder={t("products.arabic", "عربي")}
                            value={s.group_name.ar}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                group_name: {
                                  ...n[i].group_name,
                                  ar: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.english", "English")}
                            dir="ltr"
                            value={s.group_name.en}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                group_name: {
                                  ...n[i].group_name,
                                  en: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.kurdish", "کوردی")}
                            dir="ltr"
                            value={s.group_name.ku}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                group_name: {
                                  ...n[i].group_name,
                                  ku: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 pl-12">
                          <span className="text-xs font-bold text-gray-500 w-16 shrink-0 bg-gray-50 px-2 py-1 rounded text-center border">
                            {t("products.specName", "اسم الصفة")}
                          </span>
                          <Input
                            placeholder={t("products.arabic", "عربي")}
                            value={s.spec_key.ar}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_key: {
                                  ...n[i].spec_key,
                                  ar: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.english", "English")}
                            dir="ltr"
                            value={s.spec_key.en}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_key: {
                                  ...n[i].spec_key,
                                  en: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.kurdish", "کوردی")}
                            dir="ltr"
                            value={s.spec_key.ku}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_key: {
                                  ...n[i].spec_key,
                                  ku: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 pl-12">
                          <span className="text-xs font-bold text-gray-500 w-16 shrink-0 bg-gray-50 px-2 py-1 rounded text-center border">
                            {t("products.specValue", "القيمة")}
                          </span>
                          <Input
                            placeholder={t("products.arabic", "عربي")}
                            value={s.spec_value.ar}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_value: {
                                  ...n[i].spec_value,
                                  ar: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.english", "English")}
                            dir="ltr"
                            value={s.spec_value.en}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_value: {
                                  ...n[i].spec_value,
                                  en: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                          <Input
                            placeholder={t("products.kurdish", "کوردی")}
                            dir="ltr"
                            value={s.spec_value.ku}
                            onChange={(e) => {
                              const n = [...form.specifications];
                              n[i] = {
                                ...n[i],
                                spec_value: {
                                  ...n[i].spec_value,
                                  ku: e.target.value,
                                },
                              };
                              setForm({ ...form, specifications: n });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* التبويب الرابع: الصور */}
            {activeTab === "images" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-6 rounded-xl border border-dashed shadow-sm">
                  <div className="flex flex-col justify-center items-center gap-2">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <Label className="text-base font-bold cursor-pointer hover:text-primary">
                          {t("products.uploadImages", "رفع صور المنتج")}
                    </Label>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                          {t("products.uploadImagesDesc", "يمكنك تحديد عدة صور دفعة واحدة. الصورة الأولى ستكون هي الصورة الرئيسية للمنتج.")}
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      className="mt-4 max-w-xs cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) =>
                        e.target.files &&
                        setForm({ ...form, images: Array.from(e.target.files) })
                      }
                    />
                  </div>
                </div>

                {form.images.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h4 className="text-sm font-bold mb-4">
                          {t("products.selectedImages", "الصور المحددة")} ({form.images.length})
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {form.images.map((img, i) => (
                        <div
                          key={i}
                          className="relative group border rounded-lg p-1 bg-gray-50"
                        >
                          {i === 0 && (
                            <Badge className="absolute -top-2.5 -right-2.5 text-[10px] bg-primary z-10 px-2 py-0.5">
                                  {t("products.mainImage", "الرئيسية")}
                            </Badge>
                          )}
                          <img
                            src={URL.createObjectURL(img)}
                            alt="preview"
                            className="h-24 w-24 object-cover rounded shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const n = [...form.images];
                              n.splice(i, 1);
                              setForm({ ...form, images: n });
                            }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          >
                            <div className="bg-red-500 text-white rounded-full p-2">
                              <Trash2 className="h-4 w-4" />
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="bg-white"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{" "}
                      {t("common.saving", "جاري الحفظ...")}
                </span>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
