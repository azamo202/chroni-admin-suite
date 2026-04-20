import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Plus, Shield, Mail, Calendar } from "lucide-react";
import { PageHeader, FormModal } from "@/components/shared";
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
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";

export default function AdminsPage() {
  const navigate = useNavigate();
  
  // استدعاء المتجر
  const { profile, loading, isLoggingOut, fetchProfile, logout, createAdmin } = useAdminStore();

  // حالات (States) خاصة بواجهة المستخدم للنموذج فقط
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin",
    password: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login", { replace: true }); // استخدام replace لمنع المستخدم من العودة بـزر "الخلف"
  };

  const handleCreateAdmin = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    
    // استدعاء الدالة من المتجر
    const response = await createAdmin(form);
    
    if (response.success) {
      toast.success("تم إنشاء حساب المدير بنجاح");
      setModalOpen(false);
      setForm({ name: "", email: "", role: "admin", password: "" });
    } else {
      toast.error(response.message);
    }
    
    setIsSubmitting(false);
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
        title="المدراء وملفي الشخصي"
        actions={
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> إنشاء مدير جديد
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
              {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
            </Button>
          </div>
        }
      />

      <div className="max-w-2xl mt-6">
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
              {profile?.role === "super_admin" ? "مدير عام (Super Admin)" : "مدير (Admin)"}
            </Badge>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                  <Mail className="h-4 w-4" /> البريد الإلكتروني
                </div>
                <p className="text-foreground font-medium text-base">{profile?.email}</p>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                  <Shield className="h-4 w-4" /> مستوى الصلاحية
                </div>
                <p className="text-foreground font-medium text-base uppercase">{profile?.role}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
                  <Calendar className="h-4 w-4" /> تاريخ الانضمام
                </div>
                <p className="text-foreground font-medium text-base" dir="ltr">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <FormModal open={modalOpen} onOpenChange={setModalOpen} title="إنشاء مدير جديد" onSubmit={handleCreateAdmin} disabled={isSubmitting}>
          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs">الاسم</Label>
              <Input className="h-9" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">البريد الإلكتروني</Label>
              <Input type="email" className="h-9 text-left" dir="ltr" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع الصلاحية</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})} dir="rtl">
                <SelectTrigger className="h-9 text-right"><SelectValue placeholder="اختر الصلاحية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير (Admin)</SelectItem>
                  <SelectItem value="super_admin">مدير عام (Super Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">كلمة المرور</Label>
              <Input type="password" className="h-9 text-left" dir="ltr" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}