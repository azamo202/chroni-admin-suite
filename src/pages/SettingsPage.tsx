import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    companyName: 'Chrani Catalog',
    contactEmail: 'admin@chrani.com',
    contactPhone: '+964 750 000 0000',
    whatsapp: '+964 750 000 0000',
  });

  const handleSave = () => {
    toast.success(t('settings.saved'));
  };

  const isRtl = ['ar', 'ku'].includes(i18n.language);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="max-w-2xl space-y-8">
        {/* Company Info */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="font-semibold mb-4">{t('settings.companyInfo')}</h2>
          <div className="space-y-4">
            <div><Label>{t('settings.companyName')}</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div><Label>{t('settings.contactEmail')}</Label><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div><Label>{t('settings.contactPhone')}</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div>
              <Label>{t('settings.logo')}</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t('settings.logo')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="font-semibold mb-2">{t('settings.whatsapp')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('settings.whatsappDesc')}</p>
          <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>

        {/* Language Info */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="font-semibold mb-2">{t('settings.language')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('settings.languageDesc')}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('settings.currentLang')}:</span>
              <span className="font-medium ltr:ml-2 rtl:mr-2">{i18n.language.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('settings.direction')}:</span>
              <span className="font-medium ltr:ml-2 rtl:mr-2">{isRtl ? 'RTL' : 'LTR'}</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave}>{t('common.save')}</Button>
      </div>
    </AdminLayout>
  );
}
