import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { mediaImages } from '@/data/mock';

export default function MediaPage() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('media.title')}</h1>
        <Button className="gap-2"><Upload className="h-4 w-4" />{t('media.upload')}</Button>
      </div>

      {/* Dropzone */}
      <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground mb-8 hover:border-primary transition-colors cursor-pointer">
        <Upload className="h-12 w-12 mx-auto mb-3" />
        <p>{t('media.dropzone')}</p>
      </div>

      {/* Gallery */}
      <h2 className="font-semibold mb-4">{t('media.gallery')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {mediaImages.map((img, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all cursor-pointer">
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
