import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";
import {
  ConfirmDialog,
  SimplePagination,
  PageHeader,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductFormModal } from "@/features/products/components/ProductFormModal";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Store
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
    duplicateProduct,
  } = useProductStore();

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modelNumber, setModelNumber] = useState("");
  const [sort, setSort] = useState("latest");

  const debouncedModelNumber = useDebounce(modelNumber, 300);

  // Pagination & Modals State
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Query Fetching
  useQuery({
    queryKey: [
      "products-data-list",
      page,
      debouncedSearch,
      filterCategory,
      filterBrand,
      debouncedModelNumber,
      sort,
      filterStatus,
    ],
    queryFn: async () => {
      const flatten = (cats: any[]): any[] =>
        cats.reduce(
          (acc, cat) => acc.concat(cat, flatten(cat.children || [])),
          [],
        );
      const allCats = flatten(categories || []);
      const selectedCat = allCats.find((c) => String(c.id) === filterCategory);
      const category_slug = selectedCat?.slug || filterCategory;

      await fetchData({
        page,
        search: debouncedSearch,
        category_id: filterCategory,
        category_slug: category_slug,
        brand_id: filterBrand,
        model_number: debouncedModelNumber,
        sort,
        is_active: filterStatus,
      });
      return true;
    },
    staleTime: 5000,
  });

  const paginated = products;

  // Handlers
  const openAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setModalOpen(true);
  };

  useEffect(() => {
    if (location.state?.editProduct) {
      setTimeout(() => {
        openEdit(location.state.editProduct);
        window.history.replaceState({}, document.title);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.editProduct]);

  const handleSave = async (formData: FormData) => {
    setIsSubmitting(true);

    const response = editingProduct
      ? await updateProduct(editingProduct.id, formData)
      : await createProduct(formData);

    if (response.success) {
      toast.success(
        editingProduct
          ? t("products.productUpdated", "تم تحديث المنتج بنجاح")
          : t("products.productAdded", "تمت إضافة المنتج بنجاح"),
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
      toast.success(t("products.productDeleted", "تم حذف المنتج بنجاح"));
      queryClient.invalidateQueries({ queryKey: ["products-data-list"] });
      if (paginated.length === 1 && page > 1) setPage(page - 1);
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  const handleDuplicate = async () => {
    if (!duplicateTarget) return;
    setIsDuplicating(true);

    const response = await duplicateProduct(duplicateTarget.id);

    setIsDuplicating(false);
    setDuplicateTarget(null);

    if (response.success && response.newProductId) {
      toast.success(
        t("products.productDuplicated", "تم نسخ المنتج بنجاح، جاري الانتقال للتعديل...")
      );
      navigate(`/products/${response.newProductId}`);
    } else {
      toast.error(response.message || t("products.duplicateFailed", "فشل نسخ المنتج"));
    }
  };

  return (
    <>
      <PageHeader
        title={t("products.title", "المنتجات")}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t("products.addProduct", "إضافة منتج")}
          </Button>
        }
      />

      <ProductFilters
        search={search}
        setSearch={setSearch}
        modelNumber={modelNumber}
        setModelNumber={setModelNumber}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setSort={setSort}
        setPage={setPage}
        categories={categories}
        brands={brands}
      />

      <div className="mb-4">
        <SimplePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <ProductsTable
        paginated={paginated}
        loading={loading}
        brands={brands}
        categories={categories}
        onView={(id) => navigate(`/products/${id}`)}
        onEdit={openEdit}
        onDuplicate={setDuplicateTarget}
        onDelete={setDeleteId}
      />

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t("common.deleteConfirmTitle", "تأكيد الحذف")}
        description={t(
          "common.deleteConfirmDesc",
          "هل أنت متأكد من عملية الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
        )}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!duplicateTarget}
        onOpenChange={(v) => !v && !isDuplicating && setDuplicateTarget(null)}
        title={t("products.duplicateConfirmTitle", "نسخ المنتج")}
        description={t(
          "products.duplicateConfirmDesc",
          "هل أنت متأكد من إنشاء نسخة من هذا المنتج؟",
        )}
        onConfirm={handleDuplicate}
        variant="default"
        confirmLabel={isDuplicating ? undefined : t("products.duplicateBtn", "نسخ")}
        loading={isDuplicating}
      />
    </>
  );
}
