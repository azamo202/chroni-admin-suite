import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Wrench, Video, Download, Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
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
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'centers' | 'videos' | 'downloads'>('centers');
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
  const [centerForm, setCenterForm] = useState({ nameAr: '', nameEn: '', nameKu: '', phone: '', addressAr: '', addressEn: '', addressKu: '', locationLink: '' });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SupportVideo | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [videoForm, setVideoForm] = useState({ titleAr: '', titleEn: '', titleKu: '', youtubeUrl: '' });

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<SupportDownload | null>(null);
  const [deleteDownloadId, setDeleteDownloadId] = useState<number | null>(null);
  const [downloadForm, setDownloadForm] = useState<{ titleAr: string, titleEn: string, titleKu: string, file: File | null }>({ titleAr: '', titleEn: '', titleKu: '', file: null });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- معالجات مراكز الصيانة ---
  const openAddCenter = () => {
    setEditingCenter(null);
    setCenterForm({ nameAr: '', nameEn: '', nameKu: '', phone: '', addressAr: '', addressEn: '', addressKu: '', locationLink: '' });
    setIsCenterModalOpen(true);
  };

  const openEditCenter = (center: MaintenanceCenter) => {
    setEditingCenter(center);
    const name = parseI18n(center.name);
    const address = parseI18n(center.address);
    setCenterForm({
      nameAr: name.ar, nameEn: name.en, nameKu: name.ku,
      phone: center.phone || center.phone_number || '',
      addressAr: address.ar, addressEn: address.en, addressKu: address.ku,
      locationLink: center.location_link || ''
    });
    setIsCenterModalOpen(true);
  };

  const handleCenterSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      name: { ar: centerForm.nameAr, en: centerForm.nameEn, ku: centerForm.nameKu },
      phone: centerForm.phone,
      address: { ar: centerForm.addressAr, en: centerForm.addressEn, ku: centerForm.addressKu },
      location_link: centerForm.locationLink
    };

    const res = editingCenter 
      ? await updateCenter(editingCenter.id, payload)
      : await createCenter(payload);

    if (res.success) {
      toast.success(editingCenter ? 'تم تحديث المركز بنجاح' : 'تم إضافة المركز بنجاح');
      setIsCenterModalOpen(false);
    } else {
      toast.error(res.message || 'حدث خطأ في العملية');
    }
    setIsSubmitting(false);
  };

  const handleDeleteCenter = async () => {
    if (!deleteCenterId) return;
    const res = await deleteCenter(deleteCenterId);
    if (res.success) toast.success('تم حذف المركز بنجاح');
    else toast.error('فشل حذف المركز');
    setDeleteCenterId(null);
  };

  // --- معالجات فيديوهات الدعم ---
  const openAddVideo = () => {
    setEditingVideo(null);
    setVideoForm({ titleAr: '', titleEn: '', titleKu: '', youtubeUrl: '' });
    setIsVideoModalOpen(true);
  };

  const openEditVideo = (video: SupportVideo) => {
    setEditingVideo(video);
    const title = parseI18n(video.title);
    setVideoForm({
      titleAr: title.ar || (video as any).title_ar || '',
      titleEn: title.en || (video as any).title_en || '',
      titleKu: title.ku || (video as any).title_ku || '',
      youtubeUrl: video.youtube_url || video.url || video.video_url || ''
    });
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      title: { ar: videoForm.titleAr, en: videoForm.titleEn, ku: videoForm.titleKu },
      youtube_url: videoForm.youtubeUrl
    };

    const res = editingVideo 
      ? await updateVideo(editingVideo.id, payload)
      : await createVideo(payload);

    if (res.success) {
      toast.success(editingVideo ? 'تم تحديث الفيديو بنجاح' : 'تم إضافة الفيديو بنجاح');
      setIsVideoModalOpen(false);
    } else {
      toast.error(res.message || 'حدث خطأ في العملية');
    }
    setIsSubmitting(false);
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    const res = await deleteVideo(deleteVideoId);
    if (res.success) toast.success('تم حذف الفيديو بنجاح');
    else toast.error('فشل حذف الفيديو');
    setDeleteVideoId(null);
  };

  // --- معالجات الملفات والكتالوجات ---
  const openAddDownload = () => {
    setEditingDownload(null);
    setDownloadForm({ titleAr: '', titleEn: '', titleKu: '', file: null });
    setIsDownloadModalOpen(true);
  };

  const openEditDownload = (download: SupportDownload) => {
    setEditingDownload(download);
    const title = parseI18n(download.title || download.name);
    setDownloadForm({
      titleAr: title.ar || '',
      titleEn: title.en || '',
      titleKu: title.ku || '',
      file: null
    });
    setIsDownloadModalOpen(true);
  };

  const handleDownloadSubmit = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title[ar]", downloadForm.titleAr);
    formData.append("title[en]", downloadForm.titleEn);
    formData.append("title[ku]", downloadForm.titleKu);
    if (downloadForm.file) formData.append("file", downloadForm.file);

    const res = editingDownload 
      ? await updateDownload(editingDownload.id, formData)
      : await createDownload(formData);

    if (res.success) {
      toast.success(editingDownload ? 'تم تحديث الملف بنجاح' : 'تم إضافة الملف بنجاح');
      setIsDownloadModalOpen(false);
    } else {
      toast.error(res.message || 'حدث خطأ في العملية');
    }
    setIsSubmitting(false);
  };

  const handleDeleteDownload = async () => {
    if (!deleteDownloadId) return;
    const res = await deleteDownload(deleteDownloadId);
    if (res.success) toast.success('تم حذف الملف بنجاح');
    else toast.error('فشل حذف الملف');
    setDeleteDownloadId(null);
  };

  const tabs = [
    { id: 'centers', label: 'مراكز الصيانة', icon: <Wrench className="h-4 w-4" /> },
    { id: 'videos', label: 'فيديوهات الدعم', icon: <Video className="h-4 w-4" /> },
    { id: 'downloads', label: 'الملفات والكتالوجات', icon: <Download className="h-4 w-4" /> }
  ];

  return (
    <>
      <PageHeader 
        title="الدعم والضمان" 
        description="إدارة وعرض مراكز الصيانة، الفيديوهات التعليمية، وملفات التحميل" 
        actions={
          <>
            {activeTab === 'centers' && (
              <Button onClick={openAddCenter} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> إضافة مركز
              </Button>
            )}
            {activeTab === 'videos' && (
              <Button onClick={openAddVideo} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> إضافة فيديو
              </Button>
            )}
            {activeTab === 'downloads' && (
              <Button onClick={openAddDownload} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> إضافة ملف
              </Button>
            )}
          </>
        }
      />

      <div className="flex gap-2 border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              {activeTab === 'centers' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">اسم المركز</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">المدينة</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">رقم الهاتف</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">العنوان</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">الإجراءات</th>
                </tr>
              )}
              {activeTab === 'videos' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">عنوان الفيديو</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">الرابط</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">الإجراءات</th>
                </tr>
              )}
              {activeTab === 'downloads' && (
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">عنوان الملف</th>
                  <th className="text-start px-4 py-3 font-medium text-xs text-muted-foreground uppercase">رابط التحميل</th>
                  <th className="text-end px-4 py-3 font-medium text-xs text-muted-foreground uppercase">الإجراءات</th>
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
                    centers.length === 0 ? <tr><td colSpan={5}><EmptyState message="لا توجد مراكز صيانة مضافة" /></td></tr> :
                    centers.map((center, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(center.name, i18n.language) || center.name || 'بدون اسم'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue(center.city, i18n.language) || center.city || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground" dir="ltr">{center.phone || center.phone_number || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue(center.address, i18n.language) || center.address || '-'}</td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditCenter(center)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteCenterId(center.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* الفيديوهات */}
                  {activeTab === 'videos' && (
                    videos.length === 0 ? <tr><td colSpan={3}><EmptyState message="لا توجد فيديوهات مضافة" /></td></tr> :
                    videos.map((video, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(video.title, i18n.language) || video.title || 'بدون عنوان'}</td>
                        <td className="px-4 py-3.5">
                          <a href={video.youtube_url || video.url || video.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium" dir="ltr">
                            عرض الفيديو
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditVideo(video)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteVideoId(video.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* الملفات */}
                  {activeTab === 'downloads' && (
                    downloads.length === 0 ? <tr><td colSpan={3}><EmptyState message="لا توجد ملفات مضافة" /></td></tr> :
                    downloads.map((file, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800">{getLocalizedValue(file.title || file.name, i18n.language) || file.title || 'بدون اسم'}</td>
                        <td className="px-4 py-3.5">
                          <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">تحميل الملف</a>
                        </td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditDownload(file)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteDownloadId(file.id)} className="text-destructive focus:bg-red-50 focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
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
      <FormModal open={isCenterModalOpen} onOpenChange={setIsCenterModalOpen} title={editingCenter ? 'تعديل مركز الصيانة' : 'إضافة مركز صيانة'} onSubmit={handleCenterSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">اسم المركز (عربي)</Label><Input className="h-9" value={centerForm.nameAr} onChange={e => setCenterForm({...centerForm, nameAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">اسم المركز (إنجليزي)</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.nameEn} onChange={e => setCenterForm({...centerForm, nameEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">اسم المركز (كردي)</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.nameKu} onChange={e => setCenterForm({...centerForm, nameKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رقم الهاتف</Label>
            <Input className="h-9 text-left" dir="ltr" value={centerForm.phone} onChange={e => setCenterForm({...centerForm, phone: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">العنوان (عربي)</Label><Input className="h-9" value={centerForm.addressAr} onChange={e => setCenterForm({...centerForm, addressAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">العنوان (إنجليزي)</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.addressEn} onChange={e => setCenterForm({...centerForm, addressEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">العنوان (كردي)</Label><Input className="h-9 text-left" dir="ltr" value={centerForm.addressKu} onChange={e => setCenterForm({...centerForm, addressKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رابط الموقع (Google Maps)</Label>
            <Input className="h-9 text-left" type="url" value={centerForm.locationLink} onChange={e => setCenterForm({...centerForm, locationLink: e.target.value})} dir="ltr" />
          </div>
        </div>
      </FormModal>

      <FormModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} title={editingVideo ? 'تعديل فيديو' : 'إضافة فيديو'} onSubmit={handleVideoSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الفيديو (عربي)</Label><Input className="h-9" value={videoForm.titleAr} onChange={e => setVideoForm({...videoForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الفيديو (إنجليزي)</Label><Input className="h-9 text-left" dir="ltr" value={videoForm.titleEn} onChange={e => setVideoForm({...videoForm, titleEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الفيديو (كردي)</Label><Input className="h-9 text-left" dir="ltr" value={videoForm.titleKu} onChange={e => setVideoForm({...videoForm, titleKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رابط يوتيوب (YouTube URL)</Label>
            <Input className="h-9 text-left" type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} dir="ltr" required />
          </div>
        </div>
      </FormModal>

      <FormModal open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen} title={editingDownload ? 'تعديل ملف/كتالوج' : 'إضافة ملف/كتالوج'} onSubmit={handleDownloadSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الملف (عربي)</Label><Input className="h-9" value={downloadForm.titleAr} onChange={e => setDownloadForm({...downloadForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الملف (إنجليزي)</Label><Input className="h-9 text-left" dir="ltr" value={downloadForm.titleEn} onChange={e => setDownloadForm({...downloadForm, titleEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">عنوان الملف (كردي)</Label><Input className="h-9 text-left" dir="ltr" value={downloadForm.titleKu} onChange={e => setDownloadForm({...downloadForm, titleKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رفع الملف (PDF, DOC, الخ)</Label>
            <Input type="file" className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all h-9" onChange={e => setDownloadForm({...downloadForm, file: e.target.files?.[0] || null})} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteCenterId} onOpenChange={(o) => !o && setDeleteCenterId(null)} title="حذف مركز الصيانة" description="هل أنت متأكد من رغبتك في حذف هذا المركز؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteCenter} />
      <ConfirmDialog open={!!deleteVideoId} onOpenChange={(o) => !o && setDeleteVideoId(null)} title="حذف الفيديو" description="هل أنت متأكد من رغبتك في حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteVideo} />
      <ConfirmDialog open={!!deleteDownloadId} onOpenChange={(o) => !o && setDeleteDownloadId(null)} title="حذف الملف" description="هل أنت متأكد من رغبتك في حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteDownload} />
    </>
  );
}