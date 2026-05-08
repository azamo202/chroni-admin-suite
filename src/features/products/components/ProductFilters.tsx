import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CategoryTreeSelect } from "@/components/shared";
import { useTranslation } from "react-i18next";

interface ProductFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  modelNumber: string;
  setModelNumber: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterBrand: string;
  setFilterBrand: (value: string) => void;
  setSort: (value: string) => void;
  setPage: (page: number) => void;
  categories: any[];
  brands: any[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  setSearch,
  modelNumber,
  setModelNumber,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  filterBrand,
  setFilterBrand,
  setSort,
  setPage,
  categories,
  brands,
}) => {
  const { t, i18n } = useTranslation();

  return (
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
            <SelectValue
              placeholder={t("products.statusFilter", "حالة المنتج")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("products.allStatuses", "جميع الحالات")}
            </SelectItem>
            <SelectItem value="1">
              {t("products.active", "مفعل (معروض)")}
            </SelectItem>
            <SelectItem value="0">{t("products.hidden", "مخفي")}</SelectItem>
          </SelectContent>
        </Select>
        <CategoryTreeSelect
          categories={categories}
          value={filterCategory}
          onChange={(v: string) => {
            setFilterCategory(v);
            setPage(1);
          }}
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
            setSort("latest");
            setPage(1);
          }}
        >
          <X className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
          {t("products.clearFilters", "مسح الفلاتر")}
        </Button>
      </div>
    </div>
  );
};
