import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CategoryTreeSelect } from "@/components/shared";
import {
  parseI18n,
  parseFeatureArray,
  parseSpecArray,
} from "@/features/products/utils/productHelpers";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { Check, Star } from "lucide-react";
import { getValidImageUrl } from "@/store/helpers";

const groupSpecs = (flatSpecs: any[]) => {
  const grouped: any[] = [];
  flatSpecs.forEach((spec) => {
    const gNameStr = JSON.stringify(spec.group_name);
    let existingGroup = grouped.find((g) => JSON.stringify(g.group_name) === gNameStr);
    if (!existingGroup) {
      existingGroup = { group_name: spec.group_name, attributes: [] };
      grouped.push(existingGroup);
    }
    existingGroup.attributes.push({
      spec_key: spec.spec_key,
      spec_value: spec.spec_value,
    });
  });
  return grouped;
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: any;
  categories: any[];
  brands: any[];
  onSave: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  brands,
  onSave,
  isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "specs" | "images"
  >("basic");

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
    originCountryAr: "",
    originCountryEn: "",
    originCountryKu: "",
    isActive: true,
    features: [] as any[],
    specifications: [] as any[],
    images: [] as File[],
  };

  const [form, setForm] = useState(initialFormState);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newPrimaryIndex, setNewPrimaryIndex] = useState<number | null>(null);

  // HTML5 Drag and Drop states
  const [draggedImg, setDraggedImg] = useState<any>(null);
  const [draggedNewImg, setDraggedNewImg] = useState<File | null>(null);

  const handleSetPrimary = async (imageId: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/products/images/${imageId}/set-primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const json = await res.json();
      if (json.status) {
        toast.success(t('products.primarySetSuccess', 'تم تعيين الصورة كصورة رئيسية'));
        
        // Move primary image to first position in existingImages list
        const updatedImages = existingImages.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        
        const primaryImg = updatedImages.find(img => img.id === imageId);
        let finalImages = updatedImages;
        if (primaryImg) {
          const rest = updatedImages.filter(img => img.id !== imageId);
          finalImages = [primaryImg, ...rest];
        }
        
        setExistingImages(finalImages);

        // Update sorting order in backend
        if (editingProduct) {
          const imageIds = finalImages.map((img) => img.id);
          await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}/reorder-images`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ image_ids: imageIds }),
          });
        }
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(t('common.error', 'حدث خطأ في العملية'));
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm(t('common.deleteConfirmDesc', 'هل أنت متأكد من حذف هذه الصورة؟'))) return;
    
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/products/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const json = await res.json();
      if (json.status) {
        toast.success(t('products.imageDeletedSuccess', 'تم حذف الصورة بنجاح'));
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(t('common.error', 'حدث خطأ في العملية'));
    }
  };

  // Handlers for existing images
  const handleDragStartExisting = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedImg(existingImages[index]);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverExisting = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const draggedOverImg = existingImages[index];
    if (draggedImg === draggedOverImg || !draggedImg) return;

    const items = existingImages.filter((item) => item !== draggedImg);
    items.splice(index, 0, draggedImg);
    setExistingImages(items);
  };

  const handleDragEndExisting = async () => {
    setDraggedImg(null);
    if (!editingProduct) return;
    try {
      const token = localStorage.getItem("admin_token");
      const imageIds = existingImages.map((img) => img.id);
      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}/reorder-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ image_ids: imageIds }),
      });
      const json = await res.json();
      if (json.status) {
        toast.success(t("products.orderUpdated", "تم تحديث ترتيب الصور بنجاح"));
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(t("common.error", "حدث خطأ في العملية"));
    }
  };

  // Handlers for new images
  const handleDragStartNew = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedNewImg(form.images[index]);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverNew = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const draggedOverImg = form.images[index];
    if (draggedNewImg === draggedOverImg || !draggedNewImg) return;

    const items = form.images.filter((item) => item !== draggedNewImg);
    items.splice(index, 0, draggedNewImg);
    
    let updatedPrimaryIndex = newPrimaryIndex;
    if (newPrimaryIndex !== null) {
      const primaryImg = form.images[newPrimaryIndex];
      updatedPrimaryIndex = items.indexOf(primaryImg);
    }
    
    setForm({ ...form, images: items });
    setNewPrimaryIndex(updatedPrimaryIndex);
  };

  const handleDragEndNew = () => {
    setDraggedNewImg(null);
  };

  useEffect(() => {
    if (isOpen) {
      setNewPrimaryIndex(null);
      if (editingProduct) {
        const p = editingProduct;
        setExistingImages(p.images || []);
        // ... rest of the existing useEffect logic ...
        const name = parseI18n(p.name);
        const desc = parseI18n(p.description);
        const origin = parseI18n(p.origin_country || p.originCountry);

        setForm({
          nameAr: name.ar,
          nameEn: name.en,
          nameKu: name.ku,
          descAr: desc.ar,
          descEn: desc.en,
          descKu: desc.ku,
          categoryId: String(
            p.category?.id || p.category_id || p.categoryId || "",
          ),
          brandId: String(p.brand?.id || p.brand_id || p.brandId || ""),
          modelNumber: p.model_number || p.modelNumber || "",
          originCountryAr: origin.ar,
          originCountryEn: origin.en,
          originCountryKu: origin.ku,
          isActive: p.is_active !== undefined ? !!Number(p.is_active) : true,
          features: parseFeatureArray(p.features),
          specifications: groupSpecs(parseSpecArray(p.specifications)),
          images: [],
        });
        setActiveTab("basic");

        // Fetch single product details
        const fetchDetails = async () => {
          try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE_URL}/api/products/${p.id}`, {
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
              const forigin = parseI18n(
                full.origin_country || full.originCountry,
              );
              const parsedFeatures = parseFeatureArray(full.features);
              const parsedSpecs = parseSpecArray(full.specifications);
              setForm((prev) => ({
                ...prev,
                nameAr: fname.ar || prev.nameAr,
                nameEn: fname.en || prev.nameEn,
                nameKu: fname.ku || prev.nameKu,
                descAr: fdesc.ar || prev.descAr,
                descEn: fdesc.en || prev.descEn,
                descKu: fdesc.ku || prev.descKu,
                originCountryAr: forigin.ar || prev.originCountryAr,
                originCountryEn: forigin.en || prev.originCountryEn,
                originCountryKu: forigin.ku || prev.originCountryKu,
                features:
                  parsedFeatures.length > 0 ? parsedFeatures : prev.features,
                specifications:
                  parsedSpecs.length > 0 ? groupSpecs(parsedSpecs) : prev.specifications,
              }));
              setExistingImages(full.images || []);
            }
          } catch (err) {
            console.error("Fetch Single Product Error", err);
          }
        };
        fetchDetails();
      } else {
        setForm(initialFormState);
        setActiveTab("basic");
      }
    }
  }, [isOpen, editingProduct]);

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      toast.error(t("products.nameArRequired", "الاسم باللغة العربية مطلوب"));
      return;
    }

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
    formData.append("origin_country[ar]", form.originCountryAr);
    formData.append("origin_country[en]", form.originCountryEn);
    formData.append("origin_country[ku]", form.originCountryKu);
    formData.append("is_active", form.isActive ? "1" : "0");

    form.images.forEach((file) => formData.append("images[]", file));
    if (newPrimaryIndex !== null) {
      formData.append("primary_image_index", String(newPrimaryIndex));
    }

    const formattedFeatures = form.features.map((f) => ({
      feature_text: f,
      feature: f,
    }));
    formData.append("features", JSON.stringify(formattedFeatures));

    const formattedSpecs: any[] = [];
    form.specifications.forEach((group: any) => {
      group.attributes.forEach((attr: any) => {
        formattedSpecs.push({
          group_name: group.group_name,
          spec_key: attr.spec_key,
          spec_value: attr.spec_value,
        });
      });
    });
    formData.append("specifications", JSON.stringify(formattedSpecs));

    await onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
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

          <div className="flex gap-4 pt-4 border-b">
            {[
              { id: "basic", label: t("products.tabBasic", "الأساسية") },
              { id: "details", label: t("products.tabDetails", "التفاصيل") },
              {
                id: "specs",
                label: t("products.tabSpecs", "المواصفات والمميزات"),
              },
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
                    dir="rtl"
                    className="text-right bg-white shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("products.categoryLabel", "القسم *")}
                  </Label>
                  <CategoryTreeSelect
                    categories={categories}
                    value={form.categoryId}
                    onChange={(v: string) =>
                      setForm({ ...form, categoryId: v })
                    }
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
                      <SelectValue
                        placeholder={t(
                          "products.selectBrand",
                          "اختر العلامة التجارية",
                        )}
                      />
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
                    ? t(
                        "products.showProductDesc",
                        "المنتج سيظهر للعملاء في المتجر",
                      )
                    : t(
                        "products.hideProductDesc",
                        "المنتج سيكون مخفياً عن العملاء",
                      )}
                </span>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t(
                      "products.modelNumberLabel",
                      "رقم الموديل (Model Number)",
                    )}
                  </Label>
                  <Input
                    value={form.modelNumber}
                    onChange={(e) =>
                      setForm({ ...form, modelNumber: e.target.value })
                    }
                    className="bg-white shadow-sm"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("products.originCountryAr", "بلد المنشأ (عربي)")}
                  </Label>
                  <Input
                    value={form.originCountryAr}
                    onChange={(e) =>
                      setForm({ ...form, originCountryAr: e.target.value })
                    }
                    className="bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("products.originCountryEn", "بلد المنشأ (إنجليزي)")}
                  </Label>
                  <Input
                    value={form.originCountryEn}
                    onChange={(e) =>
                      setForm({ ...form, originCountryEn: e.target.value })
                    }
                    dir="ltr"
                    className="text-left bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("products.originCountryKu", "بلد المنشأ (كردي)")}
                  </Label>
                  <Input
                    value={form.originCountryKu}
                    onChange={(e) =>
                      setForm({ ...form, originCountryKu: e.target.value })
                    }
                    dir="rtl"
                    className="text-right bg-white shadow-sm"
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
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                    dir="rtl"
                    value={form.descKu}
                    onChange={(e) =>
                      setForm({ ...form, descKu: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <Plus className="h-3.5 w-3.5 ml-1" />{" "}
                    {t("products.addFeature", "إضافة ميزة")}
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
                        dir="rtl"
                        className="text-right"
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

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border">
                  <Label className="text-sm font-bold text-gray-800">
                    {t(
                      "products.specsTitle",
                      "المواصفات الفنية (Specifications)",
                    )}
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
                            attributes: [
                              {
                                spec_key: { ar: "", en: "", ku: "" },
                                spec_value: { ar: "", en: "", ku: "" },
                              }
                            ]
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" />{" "}
                    {t("products.addSpecGroup", "إضافة مجموعة")}
                  </Button>
                </div>
                <div className="space-y-4">
                  {form.specifications.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                      {t("products.noSpecs", "لم يتم إضافة أي مواصفات فنية بعد")}
                    </div>
                  )}
                  {form.specifications.map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className="flex flex-col gap-4 bg-white p-4 rounded-xl border shadow-sm relative"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 rtl:left-2 ltr:right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 z-10"
                        onClick={() => {
                          const n = [...form.specifications];
                          n.splice(groupIndex, 1);
                          setForm({ ...form, specifications: n });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-3 ltr:pr-12 rtl:pl-12 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-bold text-primary w-20 shrink-0 bg-primary/10 px-2 py-1.5 rounded text-center border border-primary/20">
                          {t("products.specGroup", "المجموعة")}
                        </span>
                        <Input
                          placeholder={t("products.arabic", "عربي")}
                          value={group.group_name.ar}
                          onChange={(e) => {
                            const n = [...form.specifications];
                            n[groupIndex].group_name.ar = e.target.value;
                            setForm({ ...form, specifications: n });
                          }}
                        />
                        <Input
                          placeholder={t("products.english", "English")}
                          dir="ltr"
                          value={group.group_name.en}
                          onChange={(e) => {
                            const n = [...form.specifications];
                            n[groupIndex].group_name.en = e.target.value;
                            setForm({ ...form, specifications: n });
                          }}
                        />
                        <Input
                          placeholder={t("products.kurdish", "کوردی")}
                          dir="rtl"
                          className="text-right"
                          value={group.group_name.ku}
                          onChange={(e) => {
                            const n = [...form.specifications];
                            n[groupIndex].group_name.ku = e.target.value;
                            setForm({ ...form, specifications: n });
                          }}
                        />
                      </div>

                      <div className="space-y-3 ltr:pl-4 rtl:pr-4 ltr:border-l-2 rtl:border-r-2 border-primary/20 ltr:ml-4 rtl:mr-4">
                        {group.attributes.map((attr: any, attrIndex: number) => (
                          <div key={attrIndex} className="relative bg-gray-50/50 p-3 rounded-lg border group/attr">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 ltr:right-1 rtl:left-1 text-gray-400 hover:text-red-500 hover:bg-red-50 h-6 w-6 opacity-0 group-hover/attr:opacity-100 transition-opacity"
                              onClick={() => {
                                const n = [...form.specifications];
                                n[groupIndex].attributes.splice(attrIndex, 1);
                                setForm({ ...form, specifications: n });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            
                            <div className="flex flex-col gap-2 ltr:pr-8 rtl:pl-8">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 w-16 shrink-0 bg-white px-2 py-1.5 rounded text-center border">
                                  {t("products.specName", "اسم الصفة")}
                                </span>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.arabic", "عربي")}
                                  value={attr.spec_key.ar}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_key.ar = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.english", "English")}
                                  dir="ltr"
                                  value={attr.spec_key.en}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_key.en = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.kurdish", "کوردی")}
                                  dir="rtl"
                                  value={attr.spec_key.ku}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_key.ku = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 w-16 shrink-0 bg-white px-2 py-1.5 rounded text-center border">
                                  {t("products.specValue", "القيمة")}
                                </span>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.arabic", "عربي")}
                                  value={attr.spec_value.ar}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_value.ar = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.english", "English")}
                                  dir="ltr"
                                  value={attr.spec_value.en}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_value.en = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={t("products.kurdish", "کوردی")}
                                  dir="rtl"
                                  value={attr.spec_value.ku}
                                  onChange={(e) => {
                                    const n = [...form.specifications];
                                    n[groupIndex].attributes[attrIndex].spec_value.ku = e.target.value;
                                    setForm({ ...form, specifications: n });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary hover:text-primary hover:bg-primary/5 mt-2"
                          onClick={() => {
                            const n = [...form.specifications];
                            n[groupIndex].attributes.push({
                              spec_key: { ar: "", en: "", ku: "" },
                              spec_value: { ar: "", en: "", ku: "" },
                            });
                            setForm({ ...form, specifications: n });
                          }}
                        >
                          <Plus className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
                          {t("products.addAttribute", "إضافة صفة لهذه المجموعة")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                    {t(
                      "products.uploadImagesDesc",
                      "يمكنك تحديد عدة صور دفعة واحدة. الصورة الأولى ستكون هي الصورة الرئيسية للمنتج.",
                    )}
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-4 max-w-xs cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    onChange={(e) => {
                      if (e.target.files) {
                        setForm({ ...form, images: [...form.images, ...Array.from(e.target.files)] });
                      }
                      e.target.value = ''; // إصلاح مشكلة عدم الاستجابة عند اختيار نفس الصور
                    }}
                  />
                </div>
              </div>

              {editingProduct && existingImages.length > 0 && (
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                    <ImageIcon className="h-4 w-4" />
                    {t("products.existingImages", "صور المنتج الحالية")} ({existingImages.length})
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((img, i) => (
                      <div 
                        key={img.id || i} 
                        className={`relative group border rounded-lg p-1 bg-gray-50 transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${draggedImg === img ? 'opacity-50 border-primary border-dashed' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStartExisting(e, i)}
                        onDragOver={(e) => handleDragOverExisting(e, i)}
                        onDragEnd={handleDragEndExisting}
                      >
                        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm z-10">
                          {i + 1}
                        </div>
                        {!!Number(img.is_primary) && (
                          <Badge className="absolute -top-2.5 -right-2.5 text-[10px] bg-yellow-500 hover:bg-yellow-600 z-10 px-2 py-0.5 flex gap-1 items-center shadow-sm">
                            <Star className="h-3 w-3 fill-white" />
                            {t("products.mainImage", "الرئيسية")}
                          </Badge>
                        )}
                        <img
                          src={getValidImageUrl(img.image_path || img.url || img)}
                          alt="product"
                          className="h-24 w-24 object-cover rounded shadow-sm bg-white"
                        />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          {!Number(img.is_primary) && (
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white border-none"
                              onClick={() => handleSetPrimary(img.id)}
                              title={t('products.setAsPrimary', 'تعيين كصورة رئيسية')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleDeleteImage(img.id)}
                            title={t('common.delete', 'حذف')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.images.length > 0 && (
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <h4 className="text-sm font-bold mb-4">
                    {t("products.selectedImages", "الصور المحددة")} (
                    {form.images.length})
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {form.images.map((img, i) => {
                      const isPrimary = newPrimaryIndex === i || (newPrimaryIndex === null && existingImages.length === 0 && i === 0);
                      return (
                      <div
                        key={i}
                        className={`relative group border rounded-lg p-1 bg-gray-50 transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${draggedNewImg === img ? 'opacity-50 border-primary border-dashed' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStartNew(e, i)}
                        onDragOver={(e) => handleDragOverNew(e, i)}
                        onDragEnd={handleDragEndNew}
                      >
                        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm z-10">
                          {i + 1}
                        </div>
                        {isPrimary && (
                          <Badge className="absolute -top-2.5 -right-2.5 text-[10px] bg-primary z-10 px-2 py-0.5 flex gap-1 items-center shadow-sm">
                            <Star className="h-3 w-3 fill-white" />
                            {t("products.mainImage", "الرئيسية")}
                          </Badge>
                        )}
                        <img
                          src={URL.createObjectURL(img)}
                          alt="preview"
                          className="h-24 w-24 object-cover rounded shadow-sm bg-white"
                        />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          {!isPrimary && (
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white border-none"
                              onClick={() => {
                                const items = [...form.images];
                                const primaryImg = items[i];
                                items.splice(i, 1);
                                items.unshift(primaryImg);
                                setForm({ ...form, images: items });
                                setNewPrimaryIndex(0);
                              }}
                              title={t('products.setAsPrimary', 'تعيين كصورة رئيسية')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full"
                            onClick={() => {
                              const n = [...form.images];
                              n.splice(i, 1);
                              setForm({ ...form, images: n });
                              if (newPrimaryIndex === i) setNewPrimaryIndex(null);
                              else if (newPrimaryIndex !== null && newPrimaryIndex > i) setNewPrimaryIndex(newPrimaryIndex - 1);
                            }}
                            title={t('common.delete', 'حذف')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
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
  );
};
