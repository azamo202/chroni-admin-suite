import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // دالة مساعدة لاستخراج الاسم
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

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setProduct(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleToggle = async () => {
    toast.info('جاري تطوير الميزة للربط مع الخادم...');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Product not found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/products')}>
            {t('products.backToProducts')}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const productName = getLocalizedValue(product.name, i18n.language) || 'بدون اسم';
  const productDesc = getLocalizedValue(product.description, i18n.language) || '';
  const catName = getLocalizedValue(product.category?.name, i18n.language) || 'غير محدد';
  const brandName = product.brand?.name || 'غير محدد';
  const isActive = !!product.is_active;
  const primaryImage = product.image || (product.images?.length > 0 ? (product.images[0].url || product.images[0].image_path || product.images[0]) : null);
  const gallery = product.images?.map((img: any) => img.url || img.image_path || img) || [];

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{t('products.details')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gallery */}
        <div>
          <div className="bg-card border rounded-xl overflow-hidden mb-3">
            {primaryImage ? (
               <img src={primaryImage} alt={productName} className="w-full h-80 object-cover" />
            ) : (
               <div className="w-full h-80 flex items-center justify-center bg-muted text-muted-foreground">لا توجد صورة</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((img: string, i: number) => (
                <img key={i} src={img} alt="" className="h-20 w-full object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-transparent hover:ring-primary" />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold">{productName}</h2>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`text-[11px] ${
                  isActive
                    ? 'bg-success/10 text-success border-0'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isActive ? t('products.visible') : t('products.hidden')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{productDesc}</p>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {product.price !== null && product.price !== undefined && (
                <div>
                  <span className="text-xs text-muted-foreground block">{t('products.price')}</span>
                  <span className="font-semibold text-base">${Number(product.price).toFixed(2)}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block">{t('products.brand')}</span>
                <span className="font-medium">{brandName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{t('products.category')}</span>
                <span className="font-medium">{catName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">رقم الموديل</span>
                <span className="font-medium">{product.model_number || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">بلد المنشأ</span>
                <span className="font-medium">{product.origin_country || '-'}</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">{t('products.specifications')}</h3>
              <div className="space-y-4">
                {Object.entries(product.specifications).map(([group, specs]: [string, any], i: number) => (
                  <div key={i} className="space-y-2">
                    {/* عرض اسم المجموعة كعنوان بارز مجمع */}
                    {getLocalizedValue(group, i18n.language) && (
                      <h4 className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded inline-block">
                        {getLocalizedValue(group, i18n.language)}
                      </h4>
                    )}
                    <div className="space-y-0">
                      {Array.isArray(specs) && specs.map((spec: any, j: number) => (
                        <div key={j} className="flex justify-between py-2 border-b last:border-0 text-sm px-2">
                          <span className="text-muted-foreground">{getLocalizedValue(spec.key || spec.spec_key, i18n.language)}</span>
                          <span className="font-medium">{getLocalizedValue(spec.value || spec.spec_value, i18n.language)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">المميزات</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground px-2">
                {product.features.map((feat: any, i: number) => (
                  <li key={i}>{getLocalizedValue(feat.feature_text || feat.feature || feat, i18n.language)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleToggle} variant="outline" size="sm" className="gap-1.5">
              {isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isActive ? t('products.hidden') : t('products.visible')}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/products')}>
              <Pencil className="h-3.5 w-3.5" />
              العودة للمنتجات
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
