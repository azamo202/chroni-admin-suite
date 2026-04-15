import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, toggleProductVisibility } = useStore();
  const product = products.find((p) => p.id === id);

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

  const handleToggle = () => {
    toggleProductVisibility(product.id);
    toast.success(t('products.visibilityToggled'));
  };

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
            <img src={product.images[0] || product.image} alt={product.name} className="w-full h-80 object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-20 w-full object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-transparent hover:ring-primary" />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold">{product.name}</h2>
              <Badge
                variant={product.status === 'visible' ? 'default' : 'secondary'}
                className={`text-[11px] ${
                  product.status === 'visible'
                    ? 'bg-success/10 text-success border-0'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {product.status === 'visible' ? t('products.visible') : t('products.hidden')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">{t('products.price')}</span>
                <span className="font-semibold text-base">${product.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{t('products.brand')}</span>
                <span className="font-medium">{product.brand}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{t('products.category')}</span>
                <span className="font-medium">{product.category}</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">{t('products.specifications')}</h3>
              <div className="space-y-0">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-2.5 border-b last:border-0 text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleToggle} variant="outline" size="sm" className="gap-1.5">
              {product.status === 'visible' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {product.status === 'visible' ? t('products.hidden') : t('products.visible')}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/products')}>
              <Pencil className="h-3.5 w-3.5" />
              {t('products.editShortcut')}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
