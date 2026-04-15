import { useTranslation } from 'react-i18next';
import { Upload, ImageIcon } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { mediaImages } from '@/data/mock';

export default function MediaPage() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <PageHeader
        title={t('media.title')}
        actions={
          <Button size="sm" className="gap-1.5 h-8">
            <Upload className="h-3.5 w-3.5" />{t('media.upload')}
          </Button>
        }
      />

      {/* Dropzone */}
      <div className="border-2 border-dashed rounded-xl p-10 text-center text-muted-foreground mb-6 hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <ImageIcon className="h-6 w-6 opacity-50" />
        </div>
        <p className="text-sm font-medium">{t('media.dropzone')}</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 10MB</p>
      </div>

      {/* Gallery */}
      <h2 className="text-sm font-semibold mb-3">{t('media.gallery')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {mediaImages.map((img, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-all duration-200 cursor-pointer group">
            <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
