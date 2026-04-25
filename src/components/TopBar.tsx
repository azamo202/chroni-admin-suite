import { useTranslation } from 'react-i18next';
import { Globe, User, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { changeLanguage } from '@/i18n';
import { Separator } from '@/components/ui/separator';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ku', label: 'کوردی', flag: '🇮🇶' },
];

export function TopBar() {
  const { t, i18n } = useTranslation();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 sticky top-0 z-20">
   

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8 px-2.5 text-xs font-normal">
              <Globe className="h-3.5 w-3.5" />
              <span>{currentLang.flag}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {languages.map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={i18n.language === lang.code ? 'bg-accent font-medium' : ''}
              >
                <span className="ltr:mr-2 rtl:ml-2">{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

       
        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Profile */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground h-8 px-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium hidden sm:inline">{t('topbar.admin', 'مدير')}</span>
        </Button>
      </div>
    </header>
  );
}
