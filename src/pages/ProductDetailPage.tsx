import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground text-lg">Product not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('products.details')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="bg-card border rounded-lg p-4 mb-4">
            <img src={product.images[0] || product.image} alt={product.name} className="w-full h-80 object-cover rounded-lg" />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-20 w-full object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <Badge variant={product.status === 'visible' ? 'default' : 'secondary'}>
                {product.status === 'visible' ? t('products.visible') : t('products.hidden')}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">{product.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t('products.price')}:</span> <span className="font-semibold">${product.price.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">{t('products.brand')}:</span> <span className="font-semibold">{product.brand}</span></div>
              <div><span className="text-muted-foreground">{t('products.category')}:</span> <span className="font-semibold">{product.category}</span></div>
            </div>
          </div>

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">{t('products.specifications')}</h3>
              <div className="space-y-2">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleToggle} variant="outline" className="gap-2">
              {product.status === 'visible' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {product.status === 'visible' ? t('products.hidden') : t('products.visible')}
            </Button>
            <Button className="gap-2" onClick={() => navigate('/products')}>
              <Pencil className="h-4 w-4" />
              {t('products.editShortcut')}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
