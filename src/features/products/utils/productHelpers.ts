export const getLocalizedValue = (data: any, lang: string = "ar") => {
  if (!data) return "";
  if (typeof data === "object") return data[lang] || data.ar || data.en || "";
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object")
        return parsed[lang] || parsed.ar || parsed.en || "";
    } catch (e) {}
    return data;
  }
  return "";
};

export const parseI18n = (field: any) => {
  if (!field) return { ar: "", en: "", ku: "" };
  if (typeof field === "object")
    return { ar: field.ar || "", en: field.en || "", ku: field.ku || "" };
  if (typeof field === "string") {
    try {
      const p = JSON.parse(field);
      if (p && typeof p === "object")
        return { ar: p.ar || "", en: p.en || "", ku: p.ku || "" };
    } catch (e) {}
    return { ar: field, en: "", ku: "" };
  }
  return { ar: "", en: "", ku: "" };
};

export const parseFeatureArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === "string") {
    try {
      arr = JSON.parse(field);
      if (typeof arr === "string") arr = JSON.parse(arr); // معالجة التشفير المزدوج (Double Encoding)
    } catch (e) {
      return [];
    }
  }
  if (typeof arr === "object" && arr !== null && !Array.isArray(arr)) {
    arr = Object.values(arr); // معالجة المصفوفات الترابطية القادمة ككائنات من الخادم
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any) =>
    parseI18n(item.feature_text || item.feature || item),
  );
};

export const parseSpecArray = (field: any) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === "string") {
    try {
      arr = JSON.parse(field);
      if (typeof arr === "string") arr = JSON.parse(arr); // معالجة التشفير المزدوج
    } catch (e) {
      return [];
    }
  }
  const result: any[] = [];
  if (typeof arr === "object" && !Array.isArray(arr) && arr !== null) {
    Object.entries(arr).forEach(([groupName, specs]: [string, any]) => {
      const specsArray = Array.isArray(specs)
        ? specs
        : typeof specs === "object" && specs !== null
          ? Object.values(specs)
          : [];
      specsArray.forEach((spec: any) => {
        result.push({
          group_name: parseI18n(groupName),
          spec_key: parseI18n(spec.key || spec.spec_key || spec.name),
          spec_value: parseI18n(spec.value || spec.spec_value),
        });
      });
    });
  } else if (Array.isArray(arr)) {
    arr.forEach((item) => {
      result.push({
        group_name: parseI18n(item.group_name || item.group || ""),
        spec_key: parseI18n(item.key || item.spec_key || item.name),
        spec_value: parseI18n(item.value || item.spec_value),
      });
    });
  }
  return result;
};

export const getCategoryPath = (
  categoryId: any,
  categories: any[],
  lang: string,
  t: any,
): string => {
  if (!categoryId || !categories || !Array.isArray(categories)) return "";
  let path: string[] = [];
  const target = String(categoryId);

  const find = (cats: any[], current: any[]): boolean => {
    for (const cat of cats) {
      const next = [...current, cat];
      if (String(cat.id) === target) {
        path = next.map(
          (c) =>
            getLocalizedValue(c.name, lang) || t("common.unnamed", "بدون اسم"),
        );
        return true;
      }
      if (cat.children && Array.isArray(cat.children)) {
        if (find(cat.children, next)) return true;
      }
    }
    return false;
  };

  find(categories, []);
  return path.join(" / ");
};
