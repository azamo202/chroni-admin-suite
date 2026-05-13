import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Save, MessageCircle, Mail, Facebook, Instagram, Youtube, Globe, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<{
    phone: string[];
    whatsapp: string;
    email: string;
    tiktok: string;
    facebook: string;
    instagram: string;
    youtube: string;
  }>({
    phone: [''],
    whatsapp: '',
    email: '',
    tiktok: '',
    facebook: '',
    instagram: '',
    youtube: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${API_BASE_URL}/api/store-settings`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok && data.settings) {
          let phoneArray = [''];
          if (Array.isArray(data.settings.phone) && data.settings.phone.length > 0) {
            phoneArray = data.settings.phone;
          } else if (typeof data.settings.phone === 'string') {
             try {
                const parsed = JSON.parse(data.settings.phone);
                if (Array.isArray(parsed) && parsed.length > 0) phoneArray = parsed;
                else if (data.settings.phone) phoneArray = [data.settings.phone];
             } catch(e) {
                if (data.settings.phone) phoneArray = [data.settings.phone];
             }
          }

          setForm({
            phone: phoneArray,
            whatsapp: data.settings.whatsapp || '',
            email: data.settings.email || '',
            tiktok: data.settings.tiktok || '',
            facebook: data.settings.facebook || '',
            instagram: data.settings.instagram || '',
            youtube: data.settings.youtube || '',
          });
        }
      } catch (error) {
        console.error("Fetch Settings Error:", error);
        toast.error(t('common.error', 'حدث خطأ في العملية'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [t]);

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/store-settings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        toast.success(t('settings.saved', 'تم حفظ الإعدادات بنجاح'));
      } else {
        const data = await res.json();
        toast.error(data.message || t('common.error', 'حدث خطأ في العملية'));
      }
    } catch (error) {
      console.error("Save Settings Error:", error);
      toast.error(t('common.error', 'حدث خطأ في العملية'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('settings.title', 'إعدادات المتجر')} />
        <div className="max-w-4xl mx-auto space-y-6 mt-6">
          <div className="h-64 bg-muted/20 border border-muted/40 rounded-2xl animate-pulse" />
          <div className="h-64 bg-muted/20 border border-muted/40 rounded-2xl animate-pulse" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title={t('settings.title', 'إعدادات المتجر')} 
        description={t('settings.description', 'قم بإدارة معلومات الاتصال وروابط التواصل الاجتماعي لمتجرك بسهولة')}
        actions={
          <Button onClick={handleSave} disabled={isSubmitting || isLoading} className="h-9 gap-2 shadow-sm">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common.saving', 'جاري الحفظ...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{t('common.save', 'حفظ التغييرات')}</span>
              </>
            )}
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Company Info */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="border-b bg-muted/10 px-6 py-4 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{t('settings.contactInfo', 'معلومات الاتصال')}</h2>
              <p className="text-sm text-muted-foreground">{t('settings.contactInfoDesc', 'ستظهر هذه المعلومات في أسفل الموقع وفي صفحة التواصل')}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {t('settings.contactPhone', 'رقم الهاتف')}
              </Label>
              {form.phone.map((p, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input 
                    className="h-10 text-left bg-white transition-shadow focus:shadow-md flex-1" 
                    dir="ltr" 
                    value={p} 
                    onChange={(e) => {
                      const newPhone = [...form.phone];
                      newPhone[index] = e.target.value;
                      setForm({ ...form, phone: newPhone });
                    }} 
                    placeholder="+964 000 000 0000" 
                  />
                  {form.phone.length > 1 && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => {
                        const newPhone = form.phone.filter((_, i) => i !== index);
                        setForm({ ...form, phone: newPhone });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed mt-1"
                onClick={() => setForm({ ...form, phone: [...form.phone, ''] })}
              >
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('settings.addPhone', 'إضافة رقم هاتف')}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                {t('settings.whatsapp', 'رقم واتساب')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                value={form.whatsapp} 
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} 
                placeholder="+964 000 000 0000" 
              />
              <p className="text-[11px] text-muted-foreground font-medium">{t('settings.whatsappHelp', 'الرقم بالصيغة الدولية ليعمل رابط واتساب بشكل صحيح')}</p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {t('settings.contactEmail', 'البريد الإلكتروني')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="info@yourstore.com" 
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="border-b bg-muted/10 px-6 py-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{t('settings.socialMedia', 'حسابات التواصل الاجتماعي')}</h2>
              <p className="text-sm text-muted-foreground">{t('settings.socialMediaDesc', 'أضف روابط حساباتك ليتمكن العملاء من متابعة جديدك')}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Facebook className="h-4 w-4 text-blue-600" />
                {t('settings.facebook', 'رابط فيسبوك')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                type="url" 
                value={form.facebook} 
                onChange={(e) => setForm({ ...form, facebook: e.target.value })} 
                placeholder="https://facebook.com/..." 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Instagram className="h-4 w-4 text-pink-600" />
                {t('settings.instagram', 'رابط انستغرام')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                type="url" 
                value={form.instagram} 
                onChange={(e) => setForm({ ...form, instagram: e.target.value })} 
                placeholder="https://instagram.com/..." 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <svg className="h-4 w-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.28 6.28 0 005.4 15.6a6.28 6.28 0 006.28 6.28 6.28 6.28 0 006.28-6.28V9.12a8.27 8.27 0 004.25 1.19V6.86a4.83 4.83 0 01-2.62-1.17z"/>
                </svg>
                {t('settings.tiktok', 'رابط تيك توك')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                type="url" 
                value={form.tiktok} 
                onChange={(e) => setForm({ ...form, tiktok: e.target.value })} 
                placeholder="https://tiktok.com/@..." 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Youtube className="h-4 w-4 text-red-600" />
                {t('settings.youtube', 'رابط يوتيوب')}
              </Label>
              <Input 
                className="h-10 text-left bg-white transition-shadow focus:shadow-md" 
                dir="ltr" 
                type="url" 
                value={form.youtube} 
                onChange={(e) => setForm({ ...form, youtube: e.target.value })} 
                placeholder="https://youtube.com/..." 
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-4 pb-8">
          <Button onClick={handleSave} disabled={isSubmitting || isLoading} size="lg" className="w-full sm:w-auto min-w-[200px] h-12 text-base gap-2 shadow-md hover:shadow-lg transition-all">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common.saving', 'جاري الحفظ...')}
              </span>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {t('common.save', 'حفظ التغييرات')}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
