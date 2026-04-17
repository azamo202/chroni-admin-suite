import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Wrench, Video, Download, Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader, TableSkeleton, EmptyState, FormModal, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// دالة مساعدة لاستخراج الاسم متعدد اللغات
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

// دالة لتحويل الحقول القادمة من الباك إند إلى كائن للغات
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'centers' | 'videos' | 'downloads'>('centers');
  
  const [centers, setCenters] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);

  // حالات قسم مراكز الصيانة
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [deleteCenterId, setDeleteCenterId] = useState<string | null>(null);
  const [centerForm, setCenterForm] = useState({
    nameAr: '', nameEn: '', nameKu: '',
    phone: '',
    addressAr: '', addressEn: '', addressKu: '',
    locationLink: ''
  });

  // حالات قسم فيديوهات الدعم
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState({
    titleAr: '', titleEn: '', titleKu: '', youtubeUrl: ''
  });

  // حالات قسم الملفات والكتالوجات
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<any>(null);
  const [deleteDownloadId, setDeleteDownloadId] = useState<string | null>(null);
  const [downloadForm, setDownloadForm] = useState<{ titleAr: string, titleEn: string, titleKu: string, file: File | null }>({
    titleAr: '', titleEn: '', titleKu: '', file: null
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
    
    try {
      const [centersRes, videosRes, downloadsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/maintenance-centers", { headers }),
        fetch("http://127.0.0.1:8000/api/support-videos", { headers }),
        fetch("http://127.0.0.1:8000/api/support-downloads", { headers })
      ]);
      
      const [centersData, videosData, downloadsData] = await Promise.all([
        centersRes.json(), videosRes.json(), downloadsRes.json()
      ]);

      if (centersData.status || centersData.data) setCenters(centersData.data || []);
      if (videosData.status || videosData.data) setVideos(videosData.data || []);
      if (downloadsData.status || downloadsData.data) setDownloads(downloadsData.data || []);
    } catch (err) {
      console.error("Error fetching support data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- دوال مراكز الصيانة ---
  const openAddCenter = () => {
    setEditingCenter(null);
    setCenterForm({ nameAr: '', nameEn: '', nameKu: '', phone: '', addressAr: '', addressEn: '', addressKu: '', locationLink: '' });
    setIsCenterModalOpen(true);
  };

  const openEditCenter = (center: any) => {
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
    try {
      const token = localStorage.getItem("admin_token");
      const payload: any = {
        name: { ar: centerForm.nameAr, en: centerForm.nameEn, ku: centerForm.nameKu },
        phone: centerForm.phone,
        address: { ar: centerForm.addressAr, en: centerForm.addressEn, ku: centerForm.addressKu },
        location_link: centerForm.locationLink
      };

      if (editingCenter) payload._method = "PUT";

      const url = editingCenter
        ? `http://127.0.0.1:8000/api/maintenance-centers/${editingCenter.id}`
        : "http://127.0.0.1:8000/api/maintenance-centers";

      const res = await fetch(url, {
        method: "POST", // نستخدم POST دائماً لاحتواء _method في Laravel
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status || res.ok) {
        toast.success(editingCenter ? 'تم تحديث المركز بنجاح' : 'تم إضافة المركز بنجاح');
        setIsCenterModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'حدث خطأ في العملية');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCenter = async () => {
    if (!deleteCenterId) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/maintenance-centers/${deleteCenterId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) {
        toast.success('تم حذف المركز بنجاح');
        fetchData();
      } else {
        toast.error('فشل حذف المركز');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setDeleteCenterId(null);
    }
  };

  // --- دوال فيديوهات الدعم ---
  const openAddVideo = () => {
    setEditingVideo(null);
    setVideoForm({ titleAr: '', titleEn: '', titleKu: '', youtubeUrl: '' });
    setIsVideoModalOpen(true);
  };

  const openEditVideo = (video: any) => {
    setEditingVideo(video);
    
    const title = parseI18n(video.title);

    setVideoForm({
      titleAr: title.ar || video.title_ar || video['title.ar'] || '',
      titleEn: title.en || video.title_en || video['title.en'] || '',
      titleKu: title.ku || video.title_ku || video['title.ku'] || '',
      youtubeUrl: video.youtube_url || video.url || video.video_url || ''
    });
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const payload: any = {
        title: { ar: videoForm.titleAr, en: videoForm.titleEn, ku: videoForm.titleKu },
        youtube_url: videoForm.youtubeUrl
      };

      if (editingVideo) payload._method = "PUT";

      const url = editingVideo
        ? `http://127.0.0.1:8000/api/support-videos/${editingVideo.id}`
        : "http://127.0.0.1:8000/api/support-videos";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status || res.ok) {
        toast.success(editingVideo ? 'تم تحديث الفيديو بنجاح' : 'تم إضافة الفيديو بنجاح');
        setIsVideoModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'حدث خطأ في العملية');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/support-videos/${deleteVideoId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) {
        toast.success('تم حذف الفيديو بنجاح');
        fetchData();
      } else {
        toast.error('فشل حذف الفيديو');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setDeleteVideoId(null);
    }
  };

  // --- دوال الملفات والكتالوجات ---
  const openAddDownload = () => {
    setEditingDownload(null);
    setDownloadForm({ titleAr: '', titleEn: '', titleKu: '', file: null });
    setIsDownloadModalOpen(true);
  };

  const openEditDownload = (download: any) => {
    setEditingDownload(download);
    
    const title = parseI18n(download.title || download.name);

    setDownloadForm({
      titleAr: title.ar || download.title_ar || download['title.ar'] || '',
      titleEn: title.en || download.title_en || download['title.en'] || '',
      titleKu: title.ku || download.title_ku || download['title.ku'] || '',
      file: null // لا نضع الملف القديم، يتم رفعه فقط إذا أراد تغييره
    });
    setIsDownloadModalOpen(true);
  };

  const handleDownloadSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      
      formData.append("title[ar]", downloadForm.titleAr);
      formData.append("title[en]", downloadForm.titleEn);
      formData.append("title[ku]", downloadForm.titleKu);
      
      if (downloadForm.file) {
        formData.append("file", downloadForm.file);
      }

      if (editingDownload) formData.append("_method", "PUT");

      const url = editingDownload
        ? `http://127.0.0.1:8000/api/support-downloads/${editingDownload.id}`
        : "http://127.0.0.1:8000/api/support-downloads";

      const res = await fetch(url, {
        method: "POST", // نستخدم POST دائماً لاحتواء FormData
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }, // لا نضع Content-Type مع FormData
        body: formData
      });

      const data = await res.json();
      if (data.status || res.ok) {
        toast.success(editingDownload ? 'تم تحديث الملف بنجاح' : 'تم إضافة الملف بنجاح');
        setIsDownloadModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'حدث خطأ في العملية');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!deleteDownloadId) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/support-downloads/${deleteDownloadId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) {
        toast.success('تم حذف الملف بنجاح');
        fetchData();
      } else {
        toast.error('فشل حذف الملف');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setDeleteDownloadId(null);
    }
  };

  const tabs = [
    { id: 'centers', label: 'مراكز الصيانة', icon: <Wrench className="h-4 w-4" /> },
    { id: 'videos', label: 'فيديوهات الدعم', icon: <Video className="h-4 w-4" /> },
    { id: 'downloads', label: 'الملفات والكتالوجات', icon: <Download className="h-4 w-4" /> }
  ];

  return (
    <AdminLayout>
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

      {/* التبويبات (Tabs) */}
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

      {/* المحتوى */}
      <div className="bg-card border rounded-xl overflow-hidden">
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
                <TableSkeleton cols={activeTab === 'centers' ? 4 : 2} rows={4} />
              ) : (
                <>
                  {/* مراكز الصيانة */}
                  {activeTab === 'centers' && (
                    centers.length === 0 ? <tr><td colSpan={4}><EmptyState message="لا توجد مراكز صيانة مضافة" /></td></tr> :
                    centers.map((center: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-medium">{getLocalizedValue(center.name, i18n.language) || center.name || 'بدون اسم'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue(center.city, i18n.language) || center.city || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground" dir="ltr">{center.phone || center.phone_number || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{getLocalizedValue(center.address, i18n.language) || center.address || '-'}</td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditCenter(center)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteCenterId(center.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {/* الفيديوهات */}
                  {activeTab === 'videos' && (
                    videos.length === 0 ? <tr><td colSpan={2}><EmptyState message="لا توجد فيديوهات مضافة" /></td></tr> :
                    videos.map((video: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-medium">{getLocalizedValue(video.title, i18n.language) || video.title || 'بدون عنوان'}</td>
                        <td className="px-4 py-3.5">
                          <a href={video.youtube_url || video.url || video.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">
                            {video.youtube_url || video.url || video.video_url || 'عرض الفيديو'}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditVideo(video)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteVideoId(video.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* الملفات */}
                  {activeTab === 'downloads' && (
                    downloads.length === 0 ? <tr><td colSpan={2}><EmptyState message="لا توجد ملفات مضافة" /></td></tr> :
                    downloads.map((file: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-medium">{getLocalizedValue(file.title || file.name, i18n.language) || file.title || 'بدون اسم'}</td>
                        <td className="px-4 py-3.5">
                          <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            تحميل الملف
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditDownload(file)}><Pencil className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />تعديل</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteDownloadId(file.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />حذف</DropdownMenuItem>
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

      {/* --- نوافذ مراكز الصيانة --- */}
      <FormModal open={isCenterModalOpen} onOpenChange={setIsCenterModalOpen} title={editingCenter ? 'تعديل مركز الصيانة' : 'إضافة مركز صيانة'} onSubmit={handleCenterSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">اسم المركز (عربي)</Label><Input className="h-9" value={centerForm.nameAr} onChange={e => setCenterForm({...centerForm, nameAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">اسم المركز (إنجليزي)</Label><Input className="h-9" value={centerForm.nameEn} onChange={e => setCenterForm({...centerForm, nameEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">اسم المركز (كردي)</Label><Input className="h-9" value={centerForm.nameKu} onChange={e => setCenterForm({...centerForm, nameKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رقم الهاتف</Label>
            <Input className="h-9" value={centerForm.phone} onChange={e => setCenterForm({...centerForm, phone: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">العنوان (عربي)</Label><Input className="h-9" value={centerForm.addressAr} onChange={e => setCenterForm({...centerForm, addressAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">العنوان (إنجليزي)</Label><Input className="h-9" value={centerForm.addressEn} onChange={e => setCenterForm({...centerForm, addressEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">العنوان (كردي)</Label><Input className="h-9" value={centerForm.addressKu} onChange={e => setCenterForm({...centerForm, addressKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رابط الموقع (Google Maps)</Label>
            <Input className="h-9" type="url" value={centerForm.locationLink} onChange={e => setCenterForm({...centerForm, locationLink: e.target.value})} dir="ltr" />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteCenterId} onOpenChange={(o) => !o && setDeleteCenterId(null)} title="حذف مركز الصيانة" description="هل أنت متأكد من رغبتك في حذف هذا المركز؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteCenter} />

      {/* --- نوافذ فيديوهات الدعم --- */}
      <FormModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} title={editingVideo ? 'تعديل فيديو' : 'إضافة فيديو'} onSubmit={handleVideoSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">عنوان الفيديو (عربي)</Label><Input className="h-9" value={videoForm.titleAr} onChange={e => setVideoForm({...videoForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">عنوان الفيديو (إنجليزي)</Label><Input className="h-9" value={videoForm.titleEn} onChange={e => setVideoForm({...videoForm, titleEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">عنوان الفيديو (كردي)</Label><Input className="h-9" value={videoForm.titleKu} onChange={e => setVideoForm({...videoForm, titleKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رابط يوتيوب (YouTube URL)</Label>
            <Input className="h-9" type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} dir="ltr" required />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteVideoId} onOpenChange={(o) => !o && setDeleteVideoId(null)} title="حذف الفيديو" description="هل أنت متأكد من رغبتك في حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteVideo} />

      {/* --- نوافذ الملفات والكتالوجات --- */}
      <FormModal open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen} title={editingDownload ? 'تعديل ملف/كتالوج' : 'إضافة ملف/كتالوج'} onSubmit={handleDownloadSubmit} disabled={isSubmitting}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">عنوان الملف (عربي)</Label><Input className="h-9" value={downloadForm.titleAr} onChange={e => setDownloadForm({...downloadForm, titleAr: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">عنوان الملف (إنجليزي)</Label><Input className="h-9" value={downloadForm.titleEn} onChange={e => setDownloadForm({...downloadForm, titleEn: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-xs">عنوان الملف (كردي)</Label><Input className="h-9" value={downloadForm.titleKu} onChange={e => setDownloadForm({...downloadForm, titleKu: e.target.value})} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رفع الملف (PDF, DOC, الخ)</Label>
            <Input type="file" className="cursor-pointer" onChange={e => setDownloadForm({...downloadForm, file: e.target.files?.[0] || null})} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteDownloadId} onOpenChange={(o) => !o && setDeleteDownloadId(null)} title="حذف الملف" description="هل أنت متأكد من رغبتك في حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleDeleteDownload} />

    </AdminLayout>
  );
}
