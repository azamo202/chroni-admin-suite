import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useStore } from "@/store/useStore";
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

// دالة مساعدة لاستخراج الاسم حسب اللغة (تتعامل بذكاء مع الـ JSON String أو الـ Object)
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
      // ليس JSON، نعيد النص كما هو
    }
    return nameData;
  }
  return "بدون اسم";
};

// مكون فرعي لعرض صفوف الأقسام بشكل متداخل
const CategoryRow = ({
  category,
  level,
  onEdit,
  onDelete,
}: {
  category: any;
  level: number;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const catName = getLocalizedName(category.name, i18n.language);

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
        <td className="px-4 py-3">
          {category.image ? (
            <img
              src={category.image}
              alt={catName}
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </td>
        <td
          className="px-4 py-3.5 font-medium"
          style={
            isRtl
              ? { paddingRight: `${level * 24}px` }
              : { paddingLeft: `${level * 24}px` }
          }
        >
          <div className="flex items-center gap-2">
            {level > 0 && <span className="text-muted-foreground">└─</span>}
            <span>{catName}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <Badge
            variant={!!category.is_active ? "default" : "secondary"}
            className={
              !!category.is_active
                ? "bg-success/10 text-success border-0"
                : "bg-muted text-muted-foreground"
            }
          >
            {!!category.is_active ? "مفعل" : "غير مفعل"}
          </Badge>
        </td>
        <td className="px-4 py-3.5 text-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(category.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {category.children &&
        category.children.map((child: any) => (
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
  const { t } = useTranslation();
  const { categories, setCategories } = useStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    nameAr: string;
    nameEn: string;
    nameKu: string;
    isActive: string;
    parentId: string;
    image: File | null;
  }>({
    nameAr: "",
    nameEn: "",
    nameKu: "",
    isActive: "1",
    parentId: "",
    image: null,
  });

  // دالة جلب الأقسام من الخادم
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://127.0.0.1:8000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (json.status || json.data) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      nameAr: "",
      nameEn: "",
      nameKu: "",
      isActive: "1",
      parentId: "",
      image: null,
    });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);

    let parsed = c.name;
    if (typeof c.name === "string") {
      try {
        parsed = JSON.parse(c.name);
      } catch (e) {}
    }

    setForm({
      nameAr: parsed?.ar || c.name_ar || c['name.ar'] || (typeof parsed === "string" ? parsed : ""),
      nameEn: parsed?.en || c.name_en || c['name.en'] || "",
      nameKu: parsed?.ku || c.name_ku || c['name.ku'] || "",
      isActive: String(Number(c.is_active ?? 1)),
      parentId: c.parent_id || "",
      image: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("name[ar]", form.nameAr);
      formData.append("name[en]", form.nameEn);
      formData.append("name[ku]", form.nameKu);
      formData.append("is_active", form.isActive);
      if (form.parentId) formData.append("parent_id", form.parentId);
      if (form.image) formData.append("image", form.image);

      // إضافة _method في حال التعديل (لتوافق Laravel مع ملفات PUT)
      // إضافة _method في حال التعديل (لتوافق Laravel مع ملفات PUT)
      if (editing) formData.append("_method", "POST");

      const url = editing
        ? `http://127.0.0.1:8000/api/categories/${editing.id}`
        : "http://127.0.0.1:8000/api/categories";

      const res = await fetch(url, {
        method: "POST", // نستخدم POST دائماً لاحتواء FormData على ملفات
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (data.status || res.ok) {
        toast.success(
          editing
            ? t("categories.categoryUpdated")
            : t("categories.categoryAdded"),
        );
        setModalOpen(false);
        fetchCategories(); // تحديث الجدول فوراً
      } else {
        toast.error(data.message || "حدث خطأ في العملية");
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالخادم");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(
          `http://127.0.0.1:8000/api/categories/${deleteId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );
        if (res.ok) {
          toast.success(t("categories.categoryDeleted"));
          fetchCategories();
        } else {
          toast.error("فشل حذف القسم");
        }
      } catch (err) {
        toast.error("حدث خطأ في الاتصال بالخادم");
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title={t("categories.title")}
        actions={
          <Button onClick={openAdd} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            {t("categories.addCategory")}
          </Button>
        }
      />

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  الصورة
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  الحالة
                </th>
                <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  {t("categories.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={4} />
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4}>
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
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الاسم (عربي)</Label>
            <Input
              className="h-9"
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الاسم (إنجليزي)</Label>
            <Input
              className="h-9"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الاسم (كردي)</Label>
            <Input
              className="h-9"
              value={form.nameKu}
              onChange={(e) => setForm({ ...form, nameKu: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الصورة</Label>
            <Input
              type="file"
              className="h-9 cursor-pointer"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files?.[0] || null })
              }
              accept="image/*"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">الحالة</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.value })}
              >
                <option value="1">مفعل</option>
                <option value="0">غير مفعل</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                القسم الأب (اختياري)
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">بدون قسم أب</option>
                {categories
                  .filter((c: any) => c.id !== editing?.id)
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name?.ar || c.name || "بدون اسم"}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("categories.deleteCategory")}
        description={t("categories.confirmDelete")}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
