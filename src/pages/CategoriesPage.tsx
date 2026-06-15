import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  List,
} from "lucide-react";
import {
  useCategoryStore,
  Category,
  CategoryFormData,
} from "@/store/useCategoryStore";
import {
  FormModal,
  ConfirmDialog,
  TableSkeleton,
  EmptyState,
  PageHeader,
} from "@/components/shared";
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
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

// مكون صف القسم (نظيف ومستقل)
const CategoryRow = ({
  category,
  level,
  onEdit,
  onDelete,
}: {
  category: Category;
  level: number;
  onEdit: (c: Category) => void;
  onDelete: (id: string | number) => void;
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const catName = getLocalizedName(category.name, i18n.language, t);
  const navigate = useNavigate();

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
        <td className="px-4 py-3">
          {category.image ? (
            <img
              src={category.image}
              alt={catName}
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border shadow-sm"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </td>
        <td
          className="px-4 py-3.5 font-medium text-gray-800"
          style={
            isRtl
              ? { paddingRight: `${level * 24}px` }
              : { paddingLeft: `${level * 24}px` }
          }
        >
          <div className="flex items-center gap-2">
            {level > 0 && <span className="text-muted-foreground/60">└─</span>}
            <span>{catName}</span>
          </div>
        </td>
        <td className="px-4 py-3.5 text-muted-foreground">
          {level === 0 ? (category.sort_order ?? 0) : "-"}
        </td>
        <td className="px-4 py-3.5">
          <Badge
            variant={category.is_active ? "default" : "secondary"}
            className={
              category.is_active
                ? "bg-green-50 text-green-700 border-0"
                : "bg-muted text-muted-foreground"
            }
          >
            {category.is_active
              ? t("common.active", "مفعل")
              : t("common.inactive", "غير مفعل")}
          </Badge>
        </td>
        <td className="px-4 py-3.5 text-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigate(`/categories/${category.id}/products`)}>
                <List className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                {t("categories.manageProducts", "إدارة المنتجات")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(category.id)}
                className="text-destructive focus:bg-red-50 focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {category.children &&
        category.children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
};

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const initialFormState: CategoryFormData = {
    nameAr: "",
    nameEn: "",
    nameKu: "",
    isActive: "1",
    parentId: "",
    sortOrder: "0",
    image: null,
  };
  const [form, setForm] = useState<CategoryFormData>(initialFormState);

  // التحكم في دورة حياة الجلب باستخدام React Query
  useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      await fetchCategories();
      return true;
    },
    staleTime: Infinity, // الكاش لانهائي لتجنب إعادة التحميل عند العودة للصفحة
  });

  // تسطيح قائمة الأقسام (Flatten) لاستخدامها في قائمة "القسم الأب" المنسدلة بدون القسم الحالي
  const flatCategories = useMemo(() => {
    // 1. استبعاد القسم الحالي وجميع الأقسام الفرعية التابعة له لمنع التداخل (Circular Dependency)
    const filterOutCategoryAndDescendants = (cats: Category[], idToRemove: string | number): Category[] => {
      return cats.filter(c => String(c.id) !== String(idToRemove)).map(c => ({
        ...c,
        children: c.children ? filterOutCategoryAndDescendants(c.children, idToRemove) : []
      }));
    };

    const safeCategories = editing ? filterOutCategoryAndDescendants(categories, editing.id) : categories;

    // 2. تسطيح الأقسام المتبقية
    const flatten = (cats: Category[]): Category[] => {
      return cats.reduce((acc: Category[], cat) => {
        acc.push(cat);
        if (cat.children) acc = acc.concat(flatten(cat.children));
        return acc;
      }, []);
    };
    return flatten(safeCategories);
  }, [categories, editing]);

  const openAdd = () => {
    setEditing(null);
    const mainCategories = categories.filter(c => !c.parent_id);
    const maxSort = mainCategories.reduce((max, c) => {
      const currentSort = c.sort_order !== undefined ? Number(c.sort_order) : 0;
      return currentSort > max ? currentSort : max;
    }, 0);
    setForm({
      ...initialFormState,
      sortOrder: String(maxSort + 1),
    });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    let parsed = c.name;
    if (typeof c.name === "string") {
      try {
        parsed = JSON.parse(c.name);
      } catch (e) {}
    }
    setForm({
      nameAr:
        parsed?.ar ||
        (c as any).name_ar ||
        (c as any)["name.ar"] ||
        (typeof parsed === "string" ? parsed : ""),
      nameEn: parsed?.en || (c as any).name_en || (c as any)["name.en"] || "",
      nameKu: parsed?.ku || (c as any).name_ku || (c as any)["name.ku"] || "",
      isActive: String(Number(c.is_active ?? 1)),
      parentId: c.parent_id ? String(c.parent_id) : "",
      // إرسال الترتيب الحالي الحقيقي — نستخدم '' (فارغ) إذا كان غير محدد
      // حتى يحتفظ الباك-إند بالترتيب الحالي دون تغيير
      sortOrder: c.sort_order != null ? String(c.sort_order) : "",
      image: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      toast.error(
        t("categories.nameRequired", "يرجى إدخال اسم القسم بالعربية على الأقل"),
      );
      return;
    }

    setIsSubmitting(true);

    const response = editing
      ? await updateCategory(editing.id, form)
      : await createCategory(form);

    if (response.success) {
      toast.success(
        editing
          ? t("categories.categoryUpdated")
          : t("categories.categoryAdded"),
      );
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    } else {
      toast.error(response.message);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const response = await deleteCategory(deleteId);

    if (response.success) {
      toast.success(t("categories.categoryDeleted"));
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title={t("categories.title")}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t("categories.addCategory")}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.imageLabel", "الصورة")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.sortOrder", "الترتيب")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.status", "الحالة")}
                </th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={t("common.noResults")} />
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    level={0}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editing ? t("categories.editCategory") : t("categories.addCategory")
        }
        onSubmit={handleSubmit}
        disabled={isSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">
              {t("categories.nameAr", "الاسم (عربي)")}
            </Label>
            <Input
              className="h-9"
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">
              {t("categories.nameEn", "الاسم (إنجليزي)")}
            </Label>
            <Input
              className="h-9 text-left"
              dir="ltr"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">
              {t("categories.nameKu", "الاسم (كردي)")}
            </Label>
            <Input
              className="h-9 text-right"
              dir="rtl"
              value={form.nameKu}
              onChange={(e) => setForm({ ...form, nameKu: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">
              {t("categories.imageLabel", "الصورة")}
            </Label>
            <Input
              type="file"
              className="h-9 cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files?.[0] || null })
              }
              accept="image/*"
            />
            {editing && !form.image && editing.image && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {t(
                  "categories.keepImage",
                  "اترك الحقل فارغاً للاحتفاظ بالصورة الحالية.",
                )}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">
                {t("categories.status", "الحالة")}
              </Label>
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
              <Label className="text-xs font-medium">
                {t("categories.parentCategory", "القسم الأب (اختياري)")}
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
                value={form.parentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    parentId: val,
                    sortOrder: val ? "0" : prev.sortOrder
                  }));
                }}
              >
                <option value="">
                  {t("categories.noParent", "بدون قسم أب")}
                </option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getLocalizedName(c.name, i18n.language, t)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.parentId === "" && (
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">
                {t("categories.sortOrder", "الترتيب (الأولوية في الظهور)")}
              </Label>
              <Input
                type="number"
                min="0"
                className="h-9"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("categories.deleteCategory")}
        description={t("categories.confirmDelete")}
        onConfirm={handleDelete}
      />
    </>
  );
}
