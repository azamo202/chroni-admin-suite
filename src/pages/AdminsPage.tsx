import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Plus, Shield, Mail, Calendar, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader, FormModal, TableSkeleton, EmptyState, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAdminStore, type AdminProfile } from "@/store/useAdminStore";
import { API_BASE_URL } from "@/config";

// دالة مساعدة لترجمة وعرض الصلاحيات بشكل أنيق
const getRoleLabel = (role: string | undefined, t: any) => {
  if (!role) return "-";
  return role.toLowerCase() === "super_admin" ? t("admins.superAdmin", "مدير عام") : t("admins.admin", "مدير");
};

export default function AdminsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // استدعاء المتجر
  const { profile, admins, loading, loadingAdmins, isLoggingOut, fetchProfile, fetchAdmins, logout, createAdmin, updateAdmin, deleteAdmin } = useAdminStore();

  // حالات (States) خاصة بواجهة المستخدم للنموذج فقط
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin",
    password: "",
    password_confirmation: "",
  });

  // حالات عرض تفاصيل مدير معين
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<any>(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchAdmins();
  }, [fetchProfile, fetchAdmins]);

  const handleLogout = async () => {
    await logout();
    toast.success(t("admins.logoutSuccess", "تم تسجيل الخروج بنجاح"));
    navigate("/login", { replace: true }); // استخدام replace لمنع المستخدم من العودة بـزر "الخلف"
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    let response;

    if (editingAdmin) {
      // --- منطق التحديث ---
      if (form.password && form.password !== form.password_confirmation) {
        toast.error(t("admins.passwordsNotMatch", "كلمتا المرور غير متطابقتين"));
        setIsSubmitting(false);
        return;
      }
      const payload: Record<string, any> = { name: form.name, email: form.email, role: form.role };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      response = await updateAdmin(editingAdmin.id, payload);
    } else {
      // --- منطق الإنشاء ---
      if (!form.name || !form.email || !form.password || !form.password_confirmation) {
        toast.error(t("admins.fillRequired", "يرجى تعبئة جميع الحقول المطلوبة"));
        setIsSubmitting(false);
        return;
      }
      if (form.password !== form.password_confirmation) {
        toast.error(t("admins.passwordsNotMatch", "كلمتا المرور غير متطابقتين"));
        setIsSubmitting(false);
        return;
      }
      response = await createAdmin(form);
    }

    if (response.success) {
      toast.success(editingAdmin ? t("admins.adminUpdated", "تم تحديث بيانات المدير بنجاح") : t("admins.adminCreated", "تم إنشاء حساب المدير بنجاح"));
      setModalOpen(false);
      await fetchAdmins(); // تحديث القائمة
      // تحديث بيانات الجلسة الحالية إذا قام المدير بتعديل حسابه الشخصي
      if (editingAdmin?.id === profile?.id) {
        await fetchProfile();
      }
    } else {
      toast.error(response.message || t("common.error", "حدث خطأ في العملية"));
    }
    setIsSubmitting(false);
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdminId) return;
    const isDeletingSelf = deleteAdminId === profile?.id;
    const res = await deleteAdmin(deleteAdminId);
    if (res.success) {
      toast.success(t("admins.adminDeleted", "تم حذف المدير بنجاح"));
      if (isDeletingSelf) {
        await logout(); // تسجيل الخروج فوراً إذا حذف نفسه
        navigate("/login", { replace: true });
        return;
      }
    } else {
      toast.error(res.message || t("admins.deleteFailed", "فشل حذف المدير"));
    }
    setDeleteAdminId(null);
  };

  const handleViewAdmin = async (id: number) => {
    setViewModalOpen(true);
    setLoadingSingle(true);
    setViewAdmin(null);
    
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      
      if (res.ok && json.status) {
        setViewAdmin(json.data);
      } else {
        toast.error(t("admins.fetchError", "حدث خطأ أثناء جلب بيانات المدير"));
      }
    } catch (err) {
      console.error("Fetch Admin Error:", err);
      toast.error(t("common.error", "حدث خطأ في الاتصال بالخادم"));
    } finally {
      setLoadingSingle(false);
    }
  };

  const handlePermissionCheck = (action: () => void) => {
    if (!isSuperAdmin) {
      toast.error(t("admins.noPermission", "ليس لديك صلاحية للقيام بهذا الإجراء. هذه الصلاحية مخصصة للمدير العام فقط."));
      return;
    }
    action();
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setForm({ name: "", email: "", role: "admin", password: "", password_confirmation: "" });
    setModalOpen(true);
  };

  const openEditModal = (admin: AdminProfile) => {
    setEditingAdmin(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: "",
      password_confirmation: "",
    });
    setModalOpen(true);
  };

  const isSuperAdmin = profile?.role?.toLowerCase() === "super_admin";

  if (loading) {
    return (
      <>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("admins.title", "المدراء وملفي الشخصي")}
        actions={
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button onClick={openCreateModal} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> {t("admins.createAdmin", "إنشاء مدير جديد")}
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="gap-1.5 h-8"
              disabled={isLoggingOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              {isLoggingOut ? t("admins.loggingOut", "جاري الخروج...") : t("admins.logout", "تسجيل الخروج")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* الملف الشخصي (Profile) */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/40 p-6 flex flex-col items-center justify-center border-b">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <User className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
              <Badge
                variant="secondary"
                className="mt-2 bg-primary/10 text-primary border-primary/20"
              >
                {getRoleLabel(profile?.role, t)}
              </Badge>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                    <Mail className="h-4 w-4" /> {t("admins.email", "البريد الإلكتروني")}
                  </div>
                  <p className="text-foreground font-medium text-sm">{profile?.email}</p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                    <Shield className="h-4 w-4" /> {t("admins.roleLevel", "مستوى الصلاحية")}
                  </div>
                  <p className="text-foreground font-medium text-sm">{getRoleLabel(profile?.role, t)}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                    <Calendar className="h-4 w-4" /> {t("admins.joinDate", "تاريخ الانضمام")}
                  </div>
                  <p className="text-foreground font-medium text-sm" dir="ltr">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قائمة المدراء (Admins List) */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm h-full">
            <div className="p-5 border-b flex items-center justify-between bg-muted/10">
              <h3 className="font-bold text-lg text-gray-800">{t("admins.registeredAdmins", "المدراء المسجلين")}</h3>
              <Badge variant="outline">{admins.length} {t("admins.admin", "مدير")}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-start px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("admins.name", "الاسم")}</th>
                    <th className="text-start px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("admins.email", "البريد الإلكتروني")}</th>
                    <th className="text-start px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("admins.role", "الصلاحية")}</th>
                    <th className="text-end px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{t("common.actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAdmins ? (
                    <TableSkeleton cols={4} rows={3} />
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState message={t("admins.noAdmins", "لا يوجد مدراء آخرين مسجلين")} />
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          {admin.name}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-left" dir="ltr">{admin.email}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'} className={admin.role === 'super_admin' ? 'bg-primary/10 text-primary border-0 shadow-none' : 'shadow-none'}>
                            {getRoleLabel(admin.role, t)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAdmin(admin.id)}>
                                <Eye className="h-4 w-4 ltr:mr-2 rtl:ml-2" /><span>{t("common.view", "عرض")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePermissionCheck(() => openEditModal(admin))}>
                                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" /><span>{t("common.edit", "تعديل")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePermissionCheck(() => setDeleteAdminId(admin.id))} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" /><span>{t("common.delete", "حذف")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <FormModal
          open={modalOpen}
          onOpenChange={(o) => {
            if (!o) setEditingAdmin(null);
            setModalOpen(o);
          }}
          title={editingAdmin ? t("admins.editAdmin", "تعديل بيانات المدير") : t("admins.createAdmin", "إنشاء مدير جديد")}
          onSubmit={handleFormSubmit}
          disabled={isSubmitting}>
          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admins.name", "الاسم")}</Label>
              <Input className="h-9" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admins.email", "البريد الإلكتروني")}</Label>
              <Input type="email" className="h-9 text-left" dir="ltr" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admins.roleType", "نوع الصلاحية")}</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})} dir="rtl">
                <SelectTrigger className="h-9 text-right"><SelectValue placeholder={t("admins.selectRole", "اختر الصلاحية")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("admins.admin", "مدير")}</SelectItem>
                  <SelectItem value="super_admin">{t("admins.superAdmin", "مدير عام")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admins.password", "كلمة المرور")}</Label>
              <Input type="password" className="h-9 text-left" dir="ltr" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              {editingAdmin && <p className="text-xs text-muted-foreground mt-1">{t("admins.leavePasswordEmpty", "اتركه فارغاً لعدم تغيير كلمة المرور.")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admins.confirmPassword", "تأكيد كلمة المرور")}</Label>
              <Input type="password" className="h-9 text-left" dir="ltr" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} required />
            </div>
          </div>
        </FormModal>
      )}

      <ConfirmDialog
        open={!!deleteAdminId}
        onOpenChange={(o) => !o && setDeleteAdminId(null)}
        title={t("admins.deleteAdminTitle", "حذف المدير")}
        description={deleteAdminId === profile?.id ? t("admins.deleteSelfWarning", "تحذير: أنت على وشك حذف حسابك الشخصي! سيتم تسجيل خروجك فوراً ولن تتمكن من الدخول مرة أخرى. هل أنت متأكد؟") : t("admins.deleteWarning", "هل أنت متأكد من رغبتك في حذف هذا المدير؟ لا يمكن التراجع عن هذا الإجراء.")}
        onConfirm={handleDeleteAdmin}
      />

      {/* نافذة عرض تفاصيل المدير */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admins.adminDetails", "تفاصيل المدير")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {loadingSingle ? (
              <div className="flex justify-center items-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : viewAdmin ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center mb-2">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary shadow-sm border border-primary/20">
                    <User className="h-10 w-10" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{viewAdmin.name}</h2>
                  <Badge variant="secondary" className="mt-2 bg-gray-100">
                    {getRoleLabel(viewAdmin.role, t)}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-3 gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Mail className="h-4 w-4"/> {t("admins.email", "البريد الإلكتروني")}</span>
                    <span className="font-semibold text-sm text-gray-800" dir="ltr">{viewAdmin.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-3 gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Shield className="h-4 w-4"/> {t("admins.roleLevel", "الصلاحية")}</span>
                    <span className="font-semibold text-sm text-gray-800">{getRoleLabel(viewAdmin.role, t)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Calendar className="h-4 w-4"/> {t("admins.joinDate", "تاريخ الانضمام")}</span>
                    <span className="font-semibold text-sm text-gray-800" dir="ltr">
                      {viewAdmin.created_at ? new Date(viewAdmin.created_at).toLocaleDateString('en-GB') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t("admins.adminNotFound", "لم يتم العثور على بيانات المدير")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}