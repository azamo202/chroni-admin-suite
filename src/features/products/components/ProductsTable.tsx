import React from "react";
import { Eye, Pencil, Trash2, Copy, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton, EmptyState } from "@/components/shared";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getLocalizedValue, getCategoryPath } from "@/features/products/utils/productHelpers";
import { getValidImageUrl } from "@/store/helpers";

interface ProductsTableProps {
  paginated: any[];
  loading: boolean;
  brands: any[];
  categories: any[];
  onView: (id: string) => void;
  onEdit: (product: any) => void;
  onDuplicate: (product: any) => void;
  onDelete: (id: string) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  paginated,
  loading,
  brands,
  categories,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();

  return (
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
                    {p.image_path || p.image || (p.images && p.images.length > 0) ? (
                      <img
                        src={getValidImageUrl(p.image_path || p.image || p.images[0].image_path || p.images[0].url || p.images[0])}
                        alt="Product"
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
                      onClick={() => onView(p.id)}
                      className="font-medium hover:text-primary transition-colors text-start text-sm"
                    >
                      {getLocalizedValue(p.name, i18n.language) ||
                        t("common.unnamed", "بدون اسم")}
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
                      t,
                    ) ||
                      getLocalizedValue(p.category?.name, i18n.language) ||
                      "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-800">
                      {p.model_number || "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {getLocalizedValue(
                        p.origin_country || p.originCountry,
                        i18n.language,
                      ) || ""}
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
                      {Number(p.is_active)
                        ? t("common.active", "مفعل")
                        : t("common.inactive", "مخفي")}
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
                        <DropdownMenuItem onClick={() => onView(p.id)}>
                          <Eye className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                          {t("common.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(p)}>
                          <Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(p)}>
                          <Copy className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                          {t("products.duplicateProduct", "نسخ المنتج")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(p.id)}
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
  );
};
