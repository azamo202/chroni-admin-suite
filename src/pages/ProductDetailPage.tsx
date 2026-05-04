import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useProductDetailStore } from '@/store/useProductDetailStore';
import { useCategoryStore } from '@/store/useCategoryStore';

// تم نقل الدالة المساعدة لخارج المكون لتحسين الأداء (تجنب إعادة تعريفها في كل Render)
const getLocalizedValue = (data: any, lang: string = 'ar') => {
  if (!data) return '';
  if (typeof data === 'object') return data[lang] || data.ar || data.en || '';
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') return parsed[lang] || parsed.ar || parsed.en || '';
    } catch (e) {}
    return data;
  }
  return '';
};

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // استدعاء حالة المتجر
  const { product, loading, error, fetchProduct } = useProductDetailStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    if (id) {
      // لا تقم بإعادة الجلب إذا كان المنتج المطلوب هو نفسه المحمل مسبقاً في المتجر
      if (!product || String(product.id) !== id) {
        fetchProduct(id);
      }
    }
  }, [id, fetchProduct, product?.id]);

  // جلب الأقسام إذا لم تكن محملة مسبقاً لاستخراج المسار الكامل (الأساسي / الفرعي)
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm" />
        <p className="mt-4 text-muted-foreground text-sm font-medium">{t('products.loadingDetails', 'جاري تحميل تفاصيل المنتج...')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-xl shadow-sm mt-6">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-foreground text-lg font-bold">{error || t('products.notFound', "المنتج غير موجود")}</p>
        <p className="text-muted-foreground text-sm mt-1">{t('products.notFoundDesc', "قد يكون تم حذفه أو أن الرابط غير صحيح.")}</p>
        <Button size="sm" className="mt-6 gap-2" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('products.backToProducts')}
        </Button>
      </div>
    );
  }

  const productName = getLocalizedValue(product.name, i18n.language) || t('common.unnamed', 'بدون اسم');
  const productDesc = getLocalizedValue(product.description, i18n.language) || t('products.noDescription', 'لا يوجد وصف متاح لهذا المنتج.');
  
  let catName = '';
  const catId = product.category?.id || product.category_id || product.categoryId;
  
  if (catId && categories && categories.length > 0) {
    const findPath = (cats: any[], current: any[]): string[] | null => {
      for (const cat of cats) {
        const next = [...current, cat];
        if (String(cat.id) === String(catId)) {
          return next.map(c => getLocalizedValue(c.name, i18n.language) || t('common.unnamed', 'بدون اسم'));
        }
        if (cat.children && Array.isArray(cat.children)) {
          const found = findPath(cat.children, next);
          if (found) return found;
        }
      }
      return null;
    };
    
    const path = findPath(categories, []);
    if (path && path.length > 0) {
      catName = path.join(' / ');
    }
  }
  
  if (!catName) {
    if (product.category?.parent) {
      const parentName = getLocalizedValue(product.category.parent.name, i18n.language);
      const currentName = getLocalizedValue(product.category.name, i18n.language);
      catName = parentName ? `${parentName} / ${currentName}` : (currentName || t('products.notSpecified', 'غير محدد'));
    } else {
      catName = getLocalizedValue(product.category?.name, i18n.language) || t('products.notSpecified', 'غير محدد');
    }
  }

  const brandName = product.brand?.name || t('products.notSpecified', 'غير محدد');
  const isActive = !!product.is_active;
  const primaryImage = product.image || (product.images?.length > 0 ? (product.images[0].url || product.images[0].image_path || product.images[0]) : null);
  const gallery = product.images?.map((img: any) => img.url || img.image_path || img) || [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" className="h-9 w-9 bg-card" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180 text-muted-foreground" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">{t('products.details')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قسم الصور (Gallery) */}
        <div>
          <div className="bg-card border rounded-xl overflow-hidden mb-3 shadow-sm group relative">
            {primaryImage ? (
               <img src={primaryImage} alt={productName} className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
               <div className="w-full h-96 flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                 <EyeOff className="h-10 w-10 mb-2 opacity-50" />
               <span>{t('products.noImage', 'لا توجد صورة للمنتج')}</span>
               </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((img: string, i: number) => (
                <img 
                  key={i} 
                  src={img} 
                  alt={`صورة ${i + 1}`} 
                  className="h-24 w-full object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-all ring-2 ring-transparent hover:ring-primary shadow-sm" 
                />
              ))}
            </div>
          )}
        </div>

        {/* قسم التفاصيل (Details) */}
        <div className="space-y-5">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{productName}</h2>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`text-[12px] px-3 py-1 ${
                  isActive
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {isActive ? t('products.visible') : t('products.hidden')}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
              {productDesc}
            </p>
            
            <Separator className="my-5" />
            
            <div className="grid grid-cols-2 gap-y-5 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{t('products.brand')}</span>
                <span className="font-medium text-gray-800">{brandName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{t('products.category')}</span>
                <span className="font-medium text-gray-800">{catName}</span>
              </div>
              <div>
              <span className="text-xs text-muted-foreground block mb-1">{t('products.modelNumberLabel', 'رقم الموديل')}</span>
                <span className="font-medium text-gray-800 uppercase tracking-wide">{product.model_number || '-'}</span>
              </div>
              <div>
              <span className="text-xs text-muted-foreground block mb-1">{t('products.originCountryLabel', 'بلد المنشأ')}</span>
                <span className="font-medium text-gray-800">{getLocalizedValue(product.origin_country, i18n.language) || '-'}</span>
              </div>
            </div>
          </div>

          {/* المواصفات (Specifications) */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-bold mb-4 text-gray-900">{t('products.specifications')}</h3>
              <div className="space-y-6">
                {Object.entries(product.specifications).map(([group, specs]: [string, any], i: number) => (
                  <div key={i} className="space-y-3">
                    {getLocalizedValue(group, i18n.language) && (
                      <h4 className="text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-md inline-block">
                        {getLocalizedValue(group, i18n.language)}
                      </h4>
                    )}
                    <div className="space-y-0 rounded-lg border overflow-hidden">
                      {Array.isArray(specs) && specs.map((spec: any, j: number) => (
                        <div key={j} className="flex justify-between py-2.5 px-4 border-b last:border-0 text-sm bg-white even:bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <span className="text-muted-foreground font-medium">{getLocalizedValue(spec.key || spec.spec_key, i18n.language)}</span>
                          <span className="font-semibold text-gray-800 text-left" dir="auto">{getLocalizedValue(spec.value || spec.spec_value, i18n.language)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المميزات (Features) */}
          {product.features && product.features.length > 0 && (
            <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 text-gray-900">{t('products.featuresTitle', 'المميزات')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {product.features.map((feat: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{getLocalizedValue(feat.feature_text || feat.feature || feat, i18n.language)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* الأزرار والإجراءات */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="gap-2" onClick={() => navigate('/products', { state: { editProduct: product } })}>
              <Pencil className="h-4 w-4" />
            {t('products.editProduct', 'تعديل المنتج')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}