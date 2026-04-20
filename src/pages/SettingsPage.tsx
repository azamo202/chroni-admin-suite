import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Building2, MessageCircle, Languages } from 'lucide-react';
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
    <>
      <PageHeader title={t('settings.title')} />

      <div className="max-w-2xl space-y-5">
        {/* Company Info */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t('settings.companyInfo')}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('settings.companyName')}</Label>
              <Input className="h-9" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('settings.contactEmail')}</Label>
                <Input className="h-9" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('settings.contactPhone')}</Label>
                <Input className="h-9" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('settings.logo')}</Label>
              <div className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200">
                <Upload className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-medium">{t('settings.logo')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t('settings.whatsapp')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.whatsappDesc')}</p>
          <Input className="h-9" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>

        {/* Language Info */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t('settings.language')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.languageDesc')}</p>
          <div className="flex gap-3">
            <Badge variant="secondary" className="text-xs">
              {t('settings.currentLang')}: {i18n.language.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {t('settings.direction')}: {isRtl ? 'RTL' : 'LTR'}
            </Badge>
          </div>
        </div>

        <Button onClick={handleSave} size="sm">{t('common.save')}</Button>
      </div>
    </>
  );
}
