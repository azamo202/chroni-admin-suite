import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { useCategoryStore, Category, CategoryFormData } from "@/store/useCategoryStore";
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
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// دالة مساعدة لاستخراج الاسم حسب اللغة
const getLocalizedName = (nameData: any, lang: string = "ar") => {
  if (!nameData) return "بدون اسم";
  if (typeof nameData === "object") {
    return nameData[lang] || nameData.ar || nameData.en || "بدون اسم";
  }
  if (typeof nameData === "string") {
    try {
      const parsed = JSON.parse(nameData);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed[lang] || parsed.ar || parsed.en || "بدون اسم";
      }
    } catch (e) {
      return nameData;
    }
  }
  return "بدون اسم";
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
  const catName = getLocalizedName(category.name, i18n.language);

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
        <td className="px-4 py-3">
          {category.image ? (
            <img src={category.image} alt={catName} className="h-9 w-9 rounded-lg object-cover ring-1 ring-border shadow-sm" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </td>
        <td
          className="px-4 py-3.5 font-medium text-gray-800"
          style={isRtl ? { paddingRight: `${level * 24}px` } : { paddingLeft: `${level * 24}px` }}
        >
          <div className="flex items-center gap-2">
            {level > 0 && <span className="text-muted-foreground/60">└─</span>}
            <span>{catName}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <Badge
            variant={!!category.is_active ? "default" : "secondary"}
            className={!!category.is_active ? "bg-green-50 text-green-700 border-0" : "bg-muted text-muted-foreground"}
          >
            {!!category.is_active ? "مفعل" : "غير مفعل"}
          </Badge>
        </td>
        <td className="px-4 py-3.5 text-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(category)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t("common.edit")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(category.id)} className="text-destructive focus:bg-red-50 focus:text-destructive cursor-pointer">
                <Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {category.children && category.children.map((child) => (
        <CategoryRow key={child.id} category={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  
  const initialFormState: CategoryFormData = { nameAr: "", nameEn: "", nameKu: "", isActive: "1", parentId: "", image: null };
  const [form, setForm] = useState<CategoryFormData>(initialFormState);

  // التحكم في دورة حياة الجلب باستخدام React Query
  useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      await fetchCategories();
      return true;
    },
    staleTime: Infinity, // الكاش لانهائي لتجنب إعادة التحميل عند العودة للصفحة
  });

  // تسطيح قائمة الأقسام (Flatten) لاستخدامها في قائمة "القسم الأب" المنسدلة بدون القسم الحالي
  const flatCategories = useMemo(() => {
    const flatten = (cats: Category[]): Category[] => {
      return cats.reduce((acc: Category[], cat) => {
        acc.push(cat);
        if (cat.children) acc = acc.concat(flatten(cat.children));
        return acc;
      }, []);
    };
    const all = flatten(categories);
    return editing ? all.filter(c => c.id !== editing.id) : all;
  }, [categories, editing]);

  const openAdd = () => {
    setEditing(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    let parsed = c.name;
    if (typeof c.name === "string") {
      try { parsed = JSON.parse(c.name); } catch (e) {}
    }
    setForm({
      nameAr: parsed?.ar || (c as any).name_ar || (c as any)['name.ar'] || (typeof parsed === "string" ? parsed : ""),
      nameEn: parsed?.en || (c as any).name_en || (c as any)['name.en'] || "",
      nameKu: parsed?.ku || (c as any).name_ku || (c as any)['name.ku'] || "",
      isActive: String(Number(c.is_active ?? 1)),
      parentId: c.parent_id ? String(c.parent_id) : "",
      image: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      toast.error("يرجى إدخال اسم القسم بالعربية على الأقل");
      return;
    }

    setIsSubmitting(true);

    const response = editing
      ? await updateCategory(editing.id, form)
      : await createCategory(form);

    if (response.success) {
      toast.success(editing ? t("categories.categoryUpdated") : t("categories.categoryAdded"));
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
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
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
    } else {
      toast.error(response.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title={t("categories.title")}
        actions={<Button onClick={openAdd} size="sm" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" />{t("categories.addCategory")}</Button>}
      />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">الصورة</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("categories.name")}</th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">الحالة</th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("categories.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={4} />
              ) : categories.length === 0 ? (
                <tr><td colSpan={4}><EmptyState message={t("common.noResults")} /></td></tr>
              ) : (
                categories.map((category) => (
                  <CategoryRow key={category.id} category={category} level={0} onEdit={openEdit} onDelete={setDeleteId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? t("categories.editCategory") : t("categories.addCategory")} onSubmit={handleSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">الاسم (عربي)</Label>
            <Input className="h-9" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">الاسم (إنجليزي)</Label>
            <Input className="h-9 text-left" dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">الاسم (كردي)</Label>
            <Input className="h-9 text-left" dir="ltr" value={form.nameKu} onChange={(e) => setForm({ ...form, nameKu: e.target.value })} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-medium">الصورة</Label>
            <Input type="file" className="h-9 cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} accept="image/*" />
            {editing && !form.image && editing.image && (
              <p className="text-[10px] text-muted-foreground mt-1">اترك الحقل فارغاً للاحتفاظ بالصورة الحالية.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">الحالة</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" value={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.value })}>
                <option value="1">مفعل</option>
                <option value="0">غير مفعل</option>
              </select>
            </div>
            <div className="space-y-1.5 text-start">
              <Label className="text-xs font-medium">القسم الأب (اختياري)</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">بدون قسم أب</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{getLocalizedName(c.name)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title={t("categories.deleteCategory")} description={t("categories.confirmDelete")} onConfirm={handleDelete} />
    </>
  );
}