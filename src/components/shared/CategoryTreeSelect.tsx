import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocalizedValue } from "@/features/products/utils/productHelpers";

export const CategoryTreeSelect = ({
  categories,
  value,
  onChange,
  placeholder,
  i18n,
  t,
  disabled = false,
  showAllOption = true,
}: any) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const flatten = (cats: any[]): any[] =>
    cats.reduce((acc, cat) => acc.concat(cat, flatten(cat.children || [])), []);
  const allCats = flatten(categories || []);
  const selectedCat = allCats.find((c) => String(c.id) === String(value));
  const selectedName = selectedCat
    ? getLocalizedValue(selectedCat.name, i18n.language)
    : placeholder;

  const renderCategories = (cats: any[], level = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded[cat.id];
      const isSelected = String(cat.id) === String(value);

      return (
        <div key={cat.id} className="flex flex-col w-full">
          <div
            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-gray-700"}`}
            style={{
              paddingRight: level === 0 ? "0.5rem" : `${level * 1.5 + 0.5}rem`,
            }}
            onClick={() => handleSelect(String(cat.id))}
          >
            <span className="flex-1 text-right truncate">
              {getLocalizedValue(cat.name, i18n.language) ||
                t("common.unnamed", "بدون اسم")}
            </span>
            {hasChildren && (
              <div
                className="p-1 rounded hover:bg-gray-200 text-gray-500 mr-2 flex items-center justify-center transition-colors"
                onClick={(e) => toggleExpand(e, cat.id)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-0" : "rotate-90"}`}
                />
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
        <Button
          variant="outline"
          className={`w-full justify-between font-normal bg-white h-9 px-3 ${disabled ? "opacity-50" : "shadow-sm"}`}
        >
          <span className="truncate">
            {value === "all" || !value ? placeholder : selectedName}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-72 overflow-y-auto p-0 z-50"
        style={{
          width: "var(--radix-dropdown-menu-trigger-width)",
          minWidth: "220px",
        }}
        align="start"
      >
        {showAllOption && (
          <div
            className={`px-3 py-2.5 text-sm cursor-pointer transition-colors border-b ${value === "all" || !value ? "bg-primary/5 text-primary font-bold" : "hover:bg-muted text-gray-700"}`}
            onClick={() => handleSelect("all")}
          >
            {t("products.all", "الكل")}
          </div>
        )}
        <div className="py-1">{renderCategories(categories || [])}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
