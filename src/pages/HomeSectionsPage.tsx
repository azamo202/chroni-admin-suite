import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MoreHorizontal, Package, Search, LayoutTemplate } from "lucide-react";
import { useHomeSectionStore, HomeSection } from "@/store/useHomeSectionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { FormModal, ConfirmDialog, TableSkeleton, EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useDebounce } from "@/hooks/useDebounce";
import { getValidImageUrl } from "@/store/helpers";

const getLocalizedValue = (data: any, lang: string = "ar") => {
  const fallback = "بدون اسم";
  if (!data) return fallback;
  if (typeof data === "object") return data[lang] || data.ar || data.en || fallback;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed[lang] || parsed.ar || parsed.en || fallback;
      }
    } catch (e) {
      return data;
    }
  }
  return fallback;
};

const parseI18n = (field: any) => {
  if (!field) return { ar: "", en: "", ku: "" };
  if (typeof field === "object") return { ar: field.ar || "", en: field.en || "", ku: field.ku || "" };
  if (typeof field === "string") {
    try {
      const p = JSON.parse(field);
      if (p && typeof p === "object") return { ar: p.ar || "", en: p.en || "", ku: p.ku || "" };
    } catch (e) {}
    return { ar: field, en: "", ku: "" };
  }
  return { ar: "", en: "", ku: "" };
};

export default function HomeSectionsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { sections, loading, fetchSections, createSection, updateSection, deleteSection, attachProducts, detachProducts } = useHomeSectionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const initialFormState = {
    titleAr: "",
    titleEn: "",
    titleKu: "",
    isActive: "1",
    sortOrder: "1",
  };
  const [form, setForm] = useState(initialFormState);

  // إدارة المنتجات المربوطة
  const [manageOpen, setManageOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedModel = useDebounce(searchModel, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useQuery({
    queryKey: ["home-sections-list"],
    queryFn: async () => {
      await fetchSections();
      return true;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (manageOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [manageOpen, categories.length, fetchCategories]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!manageOpen) return;
      setIsSearching(true);
      try {
        const token = localStorage.getItem("admin_token");
        let url = `${API_BASE_URL}/api/products?per_page=50`;
        if (debouncedSearch) url += `&search=${debouncedSearch}`;
        if (debouncedModel) url += `&model_number=${debouncedModel}`;
        if (selectedCategory !== "all") url += `&category_id=${selectedCategory}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const json = await res.json();
        if (res.ok) {
          setSearchResults(json.data?.data || json.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, debouncedModel, selectedCategory, manageOpen]);

  const openAdd = () => {
    setEditing(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (s: HomeSection) => {
    setEditing(s);
    const title = parseI18n(s.title);
    setForm({
      titleAr: title.ar,
      titleEn: title.en,
      titleKu: title.ku,
      isActive: Number(s.is_active) ? "1" : "0",
      sortOrder: String(s.sort_order || 1),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.titleAr.trim()) {
      toast.error(t("homeSections.titleRequired", "يرجى إدخال اسم القسم بالعربية على الأقل"));
      return;
    }
    setIsSubmitting(true);

    const payload = {
      title: {
        ar: form.titleAr,
        en: form.titleEn,
        ku: form.titleKu,
      },
      is_active: form.isActive === "1",
      sort_order: parseInt(form.sortOrder, 10) || 1,
    };

    const response = editing
      ? await updateSection(editing.id, payload)
      : await createSection(payload);

    if (response.success) {
      toast.success(editing ? t("homeSections.updated", "تم تحديث القسم بنجاح") : t("homeSections.added", "تم إضافة القسم بنجاح"));
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["home-sections-list"] });
    } else {
      toast.error(response.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const response = await deleteSection(deleteId);
    if (response.success) {
      toast.success(t("homeSections.deleted", "تم حذف القسم بنجاح"));
      queryClient.invalidateQueries({ queryKey: ["home-sections-list"] });
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  const openManageProducts = (id: number) => {
    setActiveSectionId(id);
    setSearchQuery("");
    setSearchModel("");
    setSelectedCategory("all");
    setSearchResults([]);
    setManageOpen(true);
  };

  const handleAttach = async (productId: number) => {
    if (!activeSectionId) return;
    const res = await attachProducts(activeSectionId, [productId]);
    if (res.success) {
      toast.success(t("homeSections.productAttached", "تمت إضافة المنتج للقسم"));
    } else {
      toast.error(res.message);
    }
  };

  const handleDetach = async (productId: number) => {
    if (!activeSectionId) return;
    const res = await detachProducts(activeSectionId, [productId]);
    if (res.success) {
      toast.success(t("homeSections.productDetached", "تمت إزالة المنتج من القسم"));
    } else {
      toast.error(res.message);
    }
  };

  const currentSection = sections.find((s) => s.id === activeSectionId);
  const attachedProducts = currentSection?.products || [];
  const attachedIds = attachedProducts.map((p: any) => p.id);
  const availableResults = searchResults.filter((p: any) => !attachedIds.includes(p.id));

  const groupedResults = availableResults.reduce((acc: any, p: any) => {
    const catName = p.category ? getLocalizedValue(p.category.name, i18n.language) : t("common.unnamed", "أخرى");
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(p);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={t("homeSections.pageTitle", "أقسام الصفحة الرئيسية")}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t("homeSections.addSection", "إضافة قسم جديد")}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("homeSections.sectionTitle", "عنوان القسم")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("homeSections.sortOrder", "الترتيب")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("homeSections.productsCount", "عدد المنتجات")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("homeSections.status", "الحالة")}
                </th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("common.actions", "الإجراءات")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : sections.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={t("common.noResults")} />
                  </td>
                </tr>
              ) : (
                sections.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-800 flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                      {getLocalizedValue(s.title, i18n.language)}
                    </td>
                    <td className="px-4 py-3.5 font-medium">{s.sort_order}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="bg-white">
                        {s.products?.length || 0} {t("homeSections.products", "منتجات")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={Number(s.is_active) ? "default" : "secondary"}
                        className={
                          Number(s.is_active)
                            ? "bg-green-50 text-green-700 border-0"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {Number(s.is_active) ? t("common.active", "مفعل") : t("common.inactive", "غير مفعل")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openManageProducts(s.id)}>
                            <Package className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                            {t("homeSections.manageProducts", "إدارة المنتجات")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(s.id)}
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

      {/* نافذة الإضافة/التعديل */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? t("homeSections.editSection", "تعديل القسم") : t("homeSections.addSection", "إضافة قسم جديد")}
        onSubmit={handleSubmit}
        disabled={isSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">{t("homeSections.titleAr", "عنوان القسم (عربي)")}</Label>
            <Input className="h-9" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} required />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">{t("homeSections.titleEn", "عنوان القسم (إنجليزي)")}</Label>
            <Input className="h-9 text-left" dir="ltr" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">{t("homeSections.titleKu", "عنوان القسم (كردي)")}</Label>
            <Input className="h-9 text-right" dir="rtl" value={form.titleKu} onChange={(e) => setForm({ ...form, titleKu: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">{t("homeSections.status", "الحالة")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
                value={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.value })}
              >
                <option value="1">{t("common.active", "مفعل")}</option>
                <option value="0">{t("common.inactive", "غير مفعل")}</option>
              </select>
            </div>
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">{t("homeSections.sortOrder", "الترتيب (الأقل يظهر أولاً)")}</Label>
              <Input type="number" min="1" className="h-9 text-left" dir="ltr" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} required />
            </div>
          </div>
        </div>
      </FormModal>

      {/* نافذة إدارة المنتجات المربوطة */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[85vh]">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t("homeSections.manageProductsTitle", "إدارة منتجات القسم")}: {getLocalizedValue(currentSection?.title, i18n.language)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {t("homeSections.manageProductsDesc", "ابحث عن المنتجات واضغط إضافة لربطها بهذا القسم.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
            {/* المنتجات المربوطة */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-l bg-gray-50 flex flex-col h-1/2 md:h-full">
              <div className="p-4 border-b bg-white shrink-0">
                <h4 className="font-bold text-sm text-gray-800">{t("homeSections.attachedProducts", "المنتجات المربوطة")} ({attachedProducts.length})</h4>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-2">
                {attachedProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">{t("homeSections.noAttachedProducts", "لا توجد منتجات مربوطة حالياً.")}</div>
                ) : (
                  attachedProducts.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center bg-white border p-2.5 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {p.image_path || p.image || (p.images && p.images.length > 0) ? <img src={getValidImageUrl(p.image_path || p.image || p.images[0]?.image_path || p.images[0]?.url || p.images[0])} className="w-9 h-9 rounded object-cover border shrink-0" /> : <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-gray-400" /></div>}
                        <span className="text-sm font-medium text-gray-800 truncate">{getLocalizedValue(p.name, i18n.language)}</span>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleDetach(p.id)} className="h-8 text-xs shrink-0 ltr:ml-2 rtl:mr-2">{t("common.remove", "إزالة")}</Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* البحث وإضافة المنتجات */}
            <div className="w-full md:w-1/2 bg-white flex flex-col h-1/2 md:h-full">
              <div className="p-4 border-b shrink-0 space-y-3">
                <h4 className="font-bold text-sm text-gray-800">{t("homeSections.searchProducts", "البحث عن منتجات")}</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                      <Input className="ltr:pl-9 rtl:pr-9 h-9 text-sm bg-gray-50/50" placeholder={t("products.searchByName", "ابحث بالاسم...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="relative flex-1">
                      <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                      <Input className="ltr:pl-9 rtl:pr-9 h-9 text-sm bg-gray-50/50" placeholder={t("products.searchModel", "رقم الموديل...")} value={searchModel} onChange={e => setSearchModel(e.target.value)} />
                    </div>
                  </div>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-gray-50/50 px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">{t("products.all", "الكل")}</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{getLocalizedValue(c.name, i18n.language)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {isSearching ? (
                  <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
                ) : availableResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">{t("homeSections.noResults", "لا توجد نتائج مطابقة.")}</div>
                ) : (
                  Object.entries(groupedResults).map(([catName, prods]: [string, any]) => (
                    <div key={catName} className="space-y-2">
                      <h5 className="font-semibold text-xs text-muted-foreground bg-gray-100 px-2 py-1.5 rounded">{catName}</h5>
                      {prods.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center bg-gray-50 border p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {p.image_path || p.image || (p.images && p.images.length > 0) ? <img src={getValidImageUrl(p.image_path || p.image || p.images[0]?.image_path || p.images[0]?.url || p.images[0])} className="w-9 h-9 rounded object-cover border bg-white shrink-0" /> : <div className="w-9 h-9 bg-white rounded flex items-center justify-center border shrink-0"><Package className="h-4 w-4 text-gray-400" /></div>}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 truncate">{getLocalizedValue(p.name, i18n.language)}</span>
                              {p.model_number && <span className="text-[10px] text-muted-foreground">{p.model_number}</span>}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAttach(p.id)} className="h-8 text-xs shrink-0 bg-primary hover:bg-primary/90 ltr:ml-2 rtl:mr-2">{t("common.add", "إضافة")}</Button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("homeSections.deleteSection", "حذف القسم")}
        description={t("homeSections.confirmDelete", "هل أنت متأكد من رغبتك في حذف هذا القسم؟")}
        onConfirm={handleDelete}
      />
    </>
  );
}