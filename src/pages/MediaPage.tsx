import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { Wrench, Video, Download, Plus, Pencil, Trash2, MoreHorizontal, Search } from 'lucide-react';
import { PageHeader, TableSkeleton, EmptyState, FormModal, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useMediaStore, MaintenanceCenter, SupportVideo, SupportDownload } from '@/store/useMediaStore';

// دوال مساعدة لاستخراج وتحليل البيانات متعددة اللغات
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

const parseI18n = (field: any) => {
  if (!field) return { ar: '', en: '', ku: '' };
  if (typeof field === 'object') return { ar: field.ar || '', en: field.en || '', ku: field.ku || '' };
  if (typeof field === 'string') {
    try {
      const p = JSON.parse(field);
      if (p && typeof p === 'object') return { ar: p.ar || '', en: p.en || '', ku: p.ku || '' };
    } catch(e) {}
    return { ar: field, en: '', ku: '' };
  }
  return { ar: '', en: '', ku: '' };
};

export default function MediaPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'centers' | 'videos' | 'downloads'>('centers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استدعاء حالة المتجر
  const { 
    centers, videos, downloads, loading, fetchData,
    createCenter, updateCenter, deleteCenter,
    createVideo, updateVideo, deleteVideo,
    createDownload, updateDownload, deleteDownload
  } = useMediaStore();

  // حالات النماذج (Forms)
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<MaintenanceCenter | null>(null);
  const [deleteCenterId, setDeleteCenterId] = useState<number | null>(null);
  const [centerForm, setCenterForm] = useState<{ nameAr: string, nameEn: string, nameKu: string, cityAr: string, cityEn: string, cityKu: string, phone: string[], addressAr: string, addressEn: string, addressKu: string, locationLink: string, sortOrder: string }>({ nameAr: '', nameEn: '', nameKu: '', cityAr: '', cityEn: '', cityKu: '', phone: [''], addressAr: '', addressEn: '', addressKu: '', locationLink: '', sortOrder: '0' });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SupportVideo | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [videoForm, setVideoForm] = useState({ titleAr: '', titleEn: '', titleKu: '', youtubeUrl: '', sortOrder: '0' });

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<SupportDownload | null>(null);
  const [deleteDownloadId, setDeleteDownloadId] = useState<number | null>(null);
  const [downloadForm, setDownloadForm] = useState<{ titleAr: string, titleEn: string, titleKu: string, file: File | null, sortOrder: string }>({ titleAr: '', titleEn: '', titleKu: '', file: null, sortOrder: '0' });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- فلترة البيانات محلياً لتطابق منطق الكنترولات في الباك اند بشكل ممتاز ---
  const filteredCenters = useMemo(() => {
    if (!searchQuery.trim()) return centers;
    const q = searchQuery.toLowerCase();
    return centers.filter((c) => {
      const n = parseI18n(c.name);
      const cty = parseI18n((c as any).city);
      const a = parseI18n(c.address);
      const p = c.phone || c.phone_number || '';
      const phoneStr = Array.isArray(p) ? p.join(' ') : String(p);
      return (
        n.ar.toLowerCase().includes(q) ||
        n.en.toLowerCase().includes(q) ||
        n.ku.toLowerCase().includes(q) ||
        cty.ar.toLowerCase().includes(q) ||
        cty.en.toLowerCase().includes(q) ||
        cty.ku.toLowerCase().includes(q) ||
        phoneStr.toLowerCase().includes(q) ||
        a.ar.toLowerCase().includes(q) ||
        a.en.toLowerCase().includes(q) ||
        a.ku.toLowerCase().includes(q)
      );
    });
  }, [centers, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase();
    return videos.filter((v) => {
      const t = parseI18n(v.title);
      return (
        t.ar.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.ku.toLowerCase().includes(q) ||
        ((v as any).title_ar && String((v as any).title_ar).toLowerCase().includes(q))
      );
    });
  }, [videos, searchQuery]);

  const filteredDownloads = useMemo(() => {
    if (!searchQuery.trim()) return downloads;
    const q = searchQuery.toLowerCase();
    return downloads.filter((d) => {
      const t = parseI18n(d.title || d.name);
      return (
        t.ar.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.ku.toLowerCase().includes(q)
      );
    });
  }, [downloads, searchQuery]);

  // --- معالجات مراكز الصيانة ---
  const openAddCenter = () => {
    setEditingCenter(null);
    // اترك الترتيب فارغاً حتى يقوم الباك-إند بتعيينه تلقائياً (آخر مكان)
    setCenterForm({ nameAr: '', nameEn: '', nameKu: '', cityAr: '', cityEn: '', cityKu: '', phone: [''], addressAr: '', addressEn: '', addressKu: '', locationLink: '', sortOrder: '' });
    setIsCenterModalOpen(true);
  };

  const openEditCenter = (center: MaintenanceCenter) => {
    setEditingCenter(center);
    const name = parseI18n(center.name);
    const city = parseI18n((center as any).city);
    const address = parseI18n(center.address);

    let phoneArray = [''];
    const p = center.phone || center.phone_number;
    if (Array.isArray(p) && p.length > 0) {
      phoneArray = p;
    } else if (typeof p === 'string') {
      try {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed) && parsed.length > 0) phoneArray = parsed;
        else if (p) phoneArray = [p];
      } catch(e) {
        if (p) phoneArray = [p];
      }
    }

    setCenterForm({
      nameAr: name.ar, nameEn: name.en, nameKu: name.ku,
      cityAr: city.ar, cityEn: city.en, cityKu: city.ku,
      phone: phoneArray,
      addressAr: address.ar, addressEn: address.en, addressKu: address.ku,
      locationLink: center.location_link || '',
      // إرسال الترتيب الحالي الحقيقي — '' (فارغ) = يحتفظ الباك-إند بالترتيب دون تغيير
      sortOrder: center.sort_order != null ? String(center.sort_order) : ''
    });
    setIsCenterModalOpen(true);
  };

  const handleCenterSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      name: { ar: centerForm.nameAr, en: centerForm.nameEn, ku: centerForm.nameKu },
      city: { ar: centerForm.cityAr, en: centerForm.cityEn, ku: centerForm.cityKu },
      phone: centerForm.phone,
      address: { ar: centerForm.addressAr, en: centerForm.addressEn, ku: centerForm.addressKu },
      location_link: centerForm.locationLink,
      sort_order: centerForm.sortOrder
    };

    const res = editingCenter 
      ? await updateCenter(editingCenter.id, payload)
      : await createCenter(payload);

    if (res.success) {
      toast.success(editingCenter ? t('media.centerUpdated', 'تم تحديث المركز بنجاح') : t('media.centerAdded', 'تم إضافة المركز بنجاح'));
      setIsCenterModalOpen(false);
    } else {
      toast.error(res.message || t('common.error', 'حدث خطأ في العملية'));
    }
    setIsSubmitting(false);
  };

  const handleDeleteCenter = async () => {
    if (!deleteCenterId) return;
    const res = await deleteCenter(deleteCenterId);
    if (res.success) toast.success(t('media.centerDeleted', 'تم حذف المركز بنجاح'));
    else toast.error(t('media.centerDeleteFailed', 'فشل حذف المركز'));
    setDeleteCenterId(null);
  };

  // --- معالجات فيديوهات الدعم ---
  const openAddVideo = () => {
    setEditingVideo(null);
    // اترك الترتيب فارغاً حتى يقوم الباك-إند بتعيينه تلقائياً (آخر مكان)
    setVideoForm({ titleAr: '', titleEn: '', titleKu: '', youtubeUrl: '', sortOrder: '' });
    setIsVideoModalOpen(true);
  };

  const openEditVideo = (video: SupportVideo) => {
    setEditingVideo(video);
    const title = parseI18n(video.title);
    setVideoForm({
      titleAr: title.ar || (video as any).title_ar || '',
      titleEn: title.en || (video as any).title_en || '',
      titleKu: title.ku || (video as any).title_ku || '',
      youtubeUrl: video.youtube_url || video.url || video.video_url || '',
      // إرسال الترتيب الحالي الحقيقي — '' (فارغ) = يحتفظ الباك-إند بالترتيب دون تغيير
      sortOrder: video.sort_order != null ? String(video.sort_order) : ''
    });
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      title: { ar: videoForm.titleAr, en: videoForm.titleEn, ku: videoForm.titleKu },
      youtube_url: videoForm.youtubeUrl,
      sort_order: videoForm.sortOrder
    };

    const res = editingVideo 
      ? await updateVideo(editingVideo.id, payload)
      : await createVideo(payload);

    if (res.success) {
      toast.success(editingVideo ? t('media.videoUpdated', 'تم تحديث الفيديو بنجاح') : t('media.videoAdded', 'تم إضافة الفيديو بنجاح'));
      setIsVideoModalOpen(false);
    } else {
      toast.error(res.message || t('common.error', 'حدث خطأ في العملية'));
    }
    setIsSubmitting(false);
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    const res = await deleteVideo(deleteVideoId);
    if (res.success) toast.success(t('media.videoDeleted', 'تم حذف الفيديو بنجاح'));
    else toast.error(t('media.videoDeleteFailed', 'فشل حذف الفيديو'));
    setDeleteVideoId(null);
  };

  // --- معالجات الملفات والكتالوجات ---
  const openAddDownload = () => {
    setEditingDownload(null);
    // اترك الترتيب فارغاً حتى يقوم الباك-إند بتعيينه تلقائياً (آخر مكان)
    setDownloadForm({ titleAr: '', titleEn: '', titleKu: '', file: null, sortOrder: '' });
    setIsDownloadModalOpen(true);
  };

  const openEditDownload = (download: SupportDownload) => {
    setEditingDownload(download);
    const title = parseI18n(download.title || download.name);
    setDownloadForm({
      titleAr: title.ar || '',
      titleEn: title.en || '',
      titleKu: title.ku || '',
      file: null,
      // إرسال الترتيب الحالي الحقيقي — '' (فارغ) = يحتفظ الباك-إند بالترتيب دون تغيير
      sortOrder: download.sort_order != null ? String(download.sort_order) : ''
    });
    setIsDownloadModalOpen(true);
  };

  const handleDownloadSubmit = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title[ar]", downloadForm.titleAr);
    formData.append("title[en]", downloadForm.titleEn);
    formData.append("title[ku]", downloadForm.titleKu);
    formData.append("sort_order", downloadForm.sortOrder);
    if (downloadForm.file) formData.append("file", downloadForm.file);

    const res = editingDownload 
      ? await updateDownload(editingDownload.id, formData)
      : await createDownload(formData);

    if (res.success) {
      toast.success(editingDownload ? t('media.downloadUpdated', 'تم تحديث الملف بنجاح') : t('media.downloadAdded', 'تم إضافة الملف بنجاح'));
      setIsDownloadModalOpen(false);
    } else {
      toast.error(res.message || t('common.error', 'حدث خطأ في العملية'));
    }
    setIsSubmitting(false);
  };

  const handleDeleteDownload = async () => {
    if (!deleteDownloadId) return;
    const res = await deleteDownload(deleteDownloadId);
    if (res.success) toast.success(t('media.downloadDeleted', 'تم حذف الملف بنجاح'));
    else toast.error(t('media.downloadDeleteFailed', 'فشل حذف الملف'));
    setDeleteDownloadId(null);
  };

  const tabs = [
    { id: 'centers', label: t('media.tabs.centers', 'مراكز الصيانة'), icon: <Wrench className="h-4 w-4" /> },
    { id: 'videos', label: t('media.tabs.videos', 'فيديوهات الدعم'), icon: <Video className="h-4 w-4" /> },
    { id: 'downloads', label: t('media.tabs.downloads', 'الملفات والكتالوجات'), icon: <Download className="h-4 w-4" /> }
  ];

  return (
    <>
      <PageHeader 
        title={t('media.title', 'صفحة مراكز وفيديوهات وملفات الدعم')} 
        description={t('media.description', 'إدارة وعرض مراكز الصيانة، الفيديوهات التعليمية، وملفات التحميل')} 
        actions={
          <>
            {activeTab === 'centers' && (
              <Button onClick={openAddCenter} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> {t('media.addCenter', 'إضافة مركز')}
              </Button>
            )}
            {activeTab === 'videos' && (
              <Button onClick={openAddVideo} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> {t('media.addVideo', 'إضافة فيديو')}
              </Button>
            )}
            {activeTab === 'downloads' && (
              <Button onClick={openAddDownload} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> {t('media.addDownload', 'إضافة ملف')}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 border-b overflow-x-auto w-full sm:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input 
            placeholder={
              activeTab === 'centers' ? t('media.searchCenters', "بحث باسم المركز، الهاتف، أو العنوان...") : 
              activeTab === 'videos' ? t('media.searchVideos', "بحث بعنوان الفيديو...") : 
              t('media.searchDownloads', "بحث باسم الملف...")
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ltr:pl-9 rtl:pr-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              {activeTab === 'centers' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.centerName', 'اسم المركز')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.phone', 'رقم الهاتف')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.city', 'المدينة')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.address', 'العنوان')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.sortOrder', 'الترتيب')}</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.actions', 'الإجراءات')}</th>
                </tr>
              )}
              {activeTab === 'videos' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.videoTitle', 'عنوان الفيديو')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.link', 'الرابط')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.sortOrder', 'الترتيب')}</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.actions', 'الإجراءات')}</th>
                </tr>
              )}
              {activeTab === 'downloads' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.fileName', 'عنوان الملف')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('media.downloadLink', 'رابط التحميل')}</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.sortOrder', 'الترتيب')}</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">{t('common.actions', 'الإجراءات')}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={activeTab === 'centers' ? 5 : 3} rows={4} />
              ) : (
                <>
                  {/* مراكز الصيانة */}
                  {activeTab === 'centers' && (
                filteredCenters.length === 0 ? <tr><td colSpan={5}><EmptyState message={t('media.noCentersFound', 'لا توجد مراكز صيانة مطابقة للبحث')} /></td></tr> :
                filteredCenters.map((center, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(center.name, i18n.language) || center.name || t('common.unnamed', 'بدون اسم')}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-start">
                          <span dir="ltr">
                            {Array.isArray(center.phone) ? center.phone.join(' - ') : (center.phone || center.phone_number || '-')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue((center as any).city, i18n.language) || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue(center.address, i18n.language) || center.address || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{center.sort_order ?? 0}</td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditCenter(center)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit', 'تعديل')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteCenterId(center.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete', 'حذف')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* الفيديوهات */}
                  {activeTab === 'videos' && (
                filteredVideos.length === 0 ? <tr><td colSpan={3}><EmptyState message={t('media.noVideosFound', 'لا توجد فيديوهات مطابقة للبحث')} /></td></tr> :
                filteredVideos.map((video, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(video.title, i18n.language) || video.title || t('common.unnamed', 'بدون عنوان')}</td>
                        <td className="px-4 py-3.5 text-start">
                          <a href={video.youtube_url || video.url || video.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                            {t('media.watchVideo', 'عرض الفيديو')}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{video.sort_order ?? 0}</td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditVideo(video)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit', 'تعديل')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteVideoId(video.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete', 'حذف')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* الملفات */}
                  {activeTab === 'downloads' && (
                filteredDownloads.length === 0 ? <tr><td colSpan={3}><EmptyState message={t('media.noDownloadsFound', 'لا توجد ملفات مطابقة للبحث')} /></td></tr> :
                filteredDownloads.map((file, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(file.title || file.name, i18n.language) || file.title || t('common.unnamed', 'بدون اسم')}</td>
                        <td className="px-4 py-3.5">
                          <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">{t('media.downloadFile', 'تحميل الملف')}</a>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{file.sort_order ?? 0}</td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditDownload(file)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.edit', 'تعديل')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteDownloadId(file.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />{t('common.delete', 'حذف')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نوافذ الإضافة والتعديل */}
      <FormModal open={isCenterModalOpen} onOpenChange={setIsCenterModalOpen} title={editingCenter ? t('media.editCenter', 'تعديل مركز الصيانة') : t('media.addCenterTitle', 'إضافة مركز صيانة')} onSubmit={handleCenterSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.centerNameAr', 'اسم المركز (عربي)')}</Label><Input className="h-9" value={centerForm.nameAr} onChange={e => setCenterForm({...centerForm, nameAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.centerNameEn', 'اسم المركز (إنجليزي)')}</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.nameEn} onChange={e => setCenterForm({...centerForm, nameEn: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.centerNameKu', 'اسم المركز (كردي)')}</Label><Input className="h-9 text-right" dir="rtl" value={centerForm.nameKu} onChange={e => setCenterForm({...centerForm, nameKu: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.cityAr', 'المدينة (عربي)')}</Label><Input className="h-9" value={centerForm.cityAr} onChange={e => setCenterForm({...centerForm, cityAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.cityEn', 'المدينة (إنجليزي)')}</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.cityEn} onChange={e => setCenterForm({...centerForm, cityEn: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.cityKu', 'المدينة (كردي)')}</Label><Input className="h-9 text-right" dir="rtl" value={centerForm.cityKu} onChange={e => setCenterForm({...centerForm, cityKu: e.target.value})} /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('media.phone', 'رقم الهاتف')}</Label>
            {centerForm.phone.map((p, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input 
                  className="h-9 text-left flex-1" 
                  dir="ltr" 
                  value={p} 
                  onChange={(e) => {
                    const newPhone = [...centerForm.phone];
                    newPhone[index] = e.target.value;
                    setCenterForm({ ...centerForm, phone: newPhone });
                  }} 
                  required 
                />
                {centerForm.phone.length > 1 && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      const newPhone = centerForm.phone.filter((_, i) => i !== index);
                      setCenterForm({ ...centerForm, phone: newPhone });
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
              onClick={() => setCenterForm({ ...centerForm, phone: [...centerForm.phone, ''] })}
            >
              <Plus className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
              {t('settings.addPhone', 'إضافة رقم هاتف')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.addressAr', 'العنوان (عربي)')}</Label><Input className="h-9" value={centerForm.addressAr} onChange={e => setCenterForm({...centerForm, addressAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.addressEn', 'العنوان (إنجليزي)')}</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.addressEn} onChange={e => setCenterForm({...centerForm, addressEn: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.addressKu', 'العنوان (كردي)')}</Label><Input className="h-9 text-right" dir="rtl" value={centerForm.addressKu} onChange={e => setCenterForm({...centerForm, addressKu: e.target.value})} /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('media.locationLink', 'رابط الموقع (Google Maps)')}</Label>
            <Input className="h-9 text-left" type="url" value={centerForm.locationLink} onChange={e => setCenterForm({...centerForm, locationLink: e.target.value})} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('common.sortOrder', 'الترتيب (الأولوية)')}</Label>
            <Input className="h-9" type="number" min="0" value={centerForm.sortOrder} onChange={e => setCenterForm({...centerForm, sortOrder: e.target.value})} />
          </div>
        </div>
      </FormModal>

      <FormModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} title={editingVideo ? t('media.editVideo', 'تعديل فيديو') : t('media.addVideoTitle', 'إضافة فيديو')} onSubmit={handleVideoSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.videoTitleAr', 'عنوان الفيديو (عربي)')}</Label><Input className="h-9" value={videoForm.titleAr} onChange={e => setVideoForm({...videoForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.videoTitleEn', 'عنوان الفيديو (إنجليزي)')}</Label><Input className="h-9 text-left" dir="ltr" value={videoForm.titleEn} onChange={e => setVideoForm({...videoForm, titleEn: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.videoTitleKu', 'عنوان الفيديو (كردي)')}</Label><Input className="h-9 text-right" dir="rtl" value={videoForm.titleKu} onChange={e => setVideoForm({...videoForm, titleKu: e.target.value})} /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('media.youtubeUrl', 'رابط يوتيوب (YouTube URL)')}</Label>
            <Input className="h-9 text-left" type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} dir="ltr" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('common.sortOrder', 'الترتيب (الأولوية)')}</Label>
            <Input className="h-9" type="number" min="0" value={videoForm.sortOrder} onChange={e => setVideoForm({...videoForm, sortOrder: e.target.value})} />
          </div>
        </div>
      </FormModal>

      <FormModal open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen} title={editingDownload ? t('media.editDownload', 'تعديل ملف/كتالوج') : t('media.addDownloadTitle', 'إضافة ملف/كتالوج')} onSubmit={handleDownloadSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.fileNameAr', 'عنوان الملف (عربي)')}</Label><Input className="h-9" value={downloadForm.titleAr} onChange={e => setDownloadForm({...downloadForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.fileNameEn', 'عنوان الملف (إنجليزي)')}</Label><Input className="h-9 text-left" dir="ltr" value={downloadForm.titleEn} onChange={e => setDownloadForm({...downloadForm, titleEn: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">{t('media.fileNameKu', 'عنوان الملف (كردي)')}</Label><Input className="h-9 text-right" dir="rtl" value={downloadForm.titleKu} onChange={e => setDownloadForm({...downloadForm, titleKu: e.target.value})} /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('media.uploadFile', 'رفع الملف (PDF, DOC, الخ)')}</Label>
            <Input type="file" className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all h-9" onChange={e => setDownloadForm({...downloadForm, file: e.target.files?.[0] || null})} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('common.sortOrder', 'الترتيب (الأولوية)')}</Label>
            <Input className="h-9" type="number" min="0" value={downloadForm.sortOrder} onChange={e => setDownloadForm({...downloadForm, sortOrder: e.target.value})} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteCenterId} onOpenChange={(o) => !o && setDeleteCenterId(null)} title={t('media.deleteCenterTitle', 'حذف مركز الصيانة')} description={t('media.deleteCenterConfirm', 'هل أنت متأكد من رغبتك في حذف هذا المركز؟ لا يمكن التراجع عن هذا الإجراء.')} onConfirm={handleDeleteCenter} />
      <ConfirmDialog open={!!deleteVideoId} onOpenChange={(o) => !o && setDeleteVideoId(null)} title={t('media.deleteVideoTitle', 'حذف الفيديو')} description={t('media.deleteVideoConfirm', 'هل أنت متأكد من رغبتك في حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء.')} onConfirm={handleDeleteVideo} />
      <ConfirmDialog open={!!deleteDownloadId} onOpenChange={(o) => !o && setDeleteDownloadId(null)} title={t('media.deleteDownloadTitle', 'حذف الملف')} description={t('media.deleteDownloadConfirm', 'هل أنت متأكد من رغبتك في حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.')} onConfirm={handleDeleteDownload} />
    </>
  );
}