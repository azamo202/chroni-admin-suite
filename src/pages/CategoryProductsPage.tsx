import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useProductStore } from "@/store/useProductStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { PageHeader, TableSkeleton, EmptyState, ConfirmDialog, SimplePagination } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, ArrowRight, ArrowLeft, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

// دالة مساعدة لاستخراج الاسم حسب اللغة
const getLocalizedName = (nameData: any, lang: string = "ar", t?: any) => {
  const fallback = t ? t("common.unnamed", "بدون اسم") : "بدون اسم";
  if (!nameData) return fallback;
  if (typeof nameData === "object") {
    return nameData[lang] || nameData.ar || nameData.en || fallback;
  }
  if (typeof nameData === "string") {
    try {
      const parsed = JSON.parse(nameData);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed[lang] || parsed.ar || parsed.en || fallback;
      }
    } catch (e) {
      return nameData;
    }
  }
  return fallback;
};

const SortInput = ({ product, onUpdate }: { product: any, onUpdate: (id: string, val: number) => void }) => {
  const [val, setVal] = useState(product.sort_order ?? 0);
  const [isChanged, setIsChanged] = useState(false);
  
  useEffect(() => { 
    setVal(product.sort_order ?? 0);
    setIsChanged(false);
  }, [product.sort_order]);

  const handleSave = () => {
    const numVal = Number(val);
    if (numVal !== product.sort_order && numVal >= 0) {
      onUpdate(product.id, numVal);
    } else {
      setVal(product.sort_order ?? 0);
      setIsChanged(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5 min-w-[120px] mx-auto">
      <Input 
        type="number" 
        min="0"
        className="w-16 h-8 text-center border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-all shadow-sm" 
        value={val} 
        onChange={(e) => {
          setVal(e.target.value);
          setIsChanged(Number(e.target.value) !== product.sort_order);
        }} 
      />
      {isChanged && (
        <Button 
          size="sm" 
          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-left-1" 
          onClick={handleSave}
        >
          حفظ
        </Button>
      )}
    </div>
  );
};

export default function CategoryProductsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  
  const { categories, fetchCategories } = useCategoryStore();
  const { products, loading, fetchData, deleteProduct, updateSortOrder, autoReorderProducts, totalPages } = useProductStore();

  const [categoryName, setCategoryName] = useState("");
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [page, setPage] = useState(1);

  // البحث عن اسم القسم
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    } else {
      const findCategory = (cats: any[]): any => {
        for (const cat of cats) {
          if (String(cat.id) === id) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };
      const cat = findCategory(categories);
      if (cat) setCategoryName(getLocalizedName(cat.name, i18n.language, t));
    }
  }, [categories, id, i18n.language, t, fetchCategories]);

  const loadProducts = useCallback(() => {
    fetchData({ category_id: id, sort: 'sort_order', page });
  }, [fetchData, id, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleUpdateSortOrder = async (productId: string, newSortOrder: number) => {
    const res = await updateSortOrder(productId, newSortOrder);
    if (res.success) {
      toast.success(res.message);
      loadProducts();
    } else {
      toast.error(res.message);
    }
  };

  const handleAutoReorder = async () => {
    if (!id) return;
    setIsReordering(true);
    const res = await autoReorderProducts(id);
    if (res.success) {
      toast.success(res.message);
      loadProducts();
    } else {
      toast.error(res.message);
    }
    setIsReordering(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const response = await deleteProduct(deleteId);
    if (response.success) {
      toast.success(t("products.productDeleted", "تم حذف المنتج"));
      loadProducts();
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<string, { categoryName: string, categoryId: string, products: any[] }> = {};
    
    const mainIdStr = String(id);
    groups[mainIdStr] = {
      categoryName: t("categories.mainCategoryProducts", "المنتجات الأساسية للتصنيف"),
      categoryId: mainIdStr,
      products: []
    };

    products.forEach(product => {
      const productCatId = String(product.category_id || product.category?.id || mainIdStr);
      
      if (!groups[productCatId]) {
        groups[productCatId] = {
          categoryName: getLocalizedName(product.category?.name, i18n.language, t),
          categoryId: productCatId,
          products: []
        };
      }
      groups[productCatId].products.push(product);
    });

    const result = [];
    if (groups[mainIdStr].products.length > 0) {
      result.push(groups[mainIdStr]);
    }
    
    Object.keys(groups).forEach(key => {
      if (key !== mainIdStr && groups[key].products.length > 0) {
        result.push(groups[key]);
      }
    });

    return result;
  }, [products, id, i18n.language, t]);

  return (
    <>
      <PageHeader
        title={`${t("categories.manageProducts", "إدارة المنتجات")} - ${categoryName}`}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleAutoReorder} 
              disabled={isReordering || loading}
              className="gap-2 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${isReordering ? 'animate-spin' : ''}`} />
              {t("categories.autoReorder", "إعادة ترتيب تلقائي")}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/categories")} className="gap-2 h-9">
              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {t("common.back", "رجوع")}
            </Button>
          </div>
        }
      />

      <div className="mb-4 mt-2">
        <SimplePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
          <span className="text-sm font-medium">
            {t("categories.totalProducts", "إجمالي المنتجات:")} {products.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-16">
                  {t("products.image", "الصورة")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("products.name", "الاسم")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">
                  {t("products.category", "القسم الفرعي")}
                </th>
                <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">
                  {t("products.sortOrder", "الترتيب")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-24">
                  {t("products.status", "الحالة")}
                </th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-24">
                  {t("common.actions", "إجراءات")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message={t("common.noResults", "لا توجد نتائج")} />
                  </td>
                </tr>
              ) : (
                groupedProducts.map((group) => (
                  <Fragment key={group.categoryId}>
                    <tr className="bg-muted/50 border-b">
                      <td colSpan={6} className="px-4 py-3 font-semibold text-primary/90 text-sm">
                        {group.categoryName}
                      </td>
                    </tr>
                    {group.products.map((product) => {
                      const pName = getLocalizedName(product.name, i18n.language, t);
                      const primaryImageUrl = product.images?.find((img: any) => img.is_primary)?.url 
                        || product.images?.[0]?.url;

                      return (
                        <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            {primaryImageUrl ? (
                              <img
                                src={primaryImageUrl}
                                alt={pName}
                                className="h-10 w-10 rounded-lg object-cover ring-1 ring-border shadow-sm"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-800">
                            {pName}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">
                            <Badge variant="outline" className="bg-gray-50">
                              {getLocalizedName(product.category?.name, i18n.language, t)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <SortInput product={product} onUpdate={handleUpdateSortOrder} />
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={product.is_active ? "default" : "secondary"}
                              className={
                                product.is_active
                                  ? "bg-green-50 text-green-700 border-0"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {product.is_active
                                ? t("common.active", "مفعل")
                                : t("common.inactive", "غير مفعل")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/products/${product.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteId(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("products.deleteProduct", "حذف المنتج")}
        description={t("products.confirmDelete", "هل أنت متأكد من حذف هذا المنتج؟")}
        onConfirm={handleDelete}
      />
    </>
  );
}
