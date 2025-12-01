import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Moon, Sun, Globe, Bell, Shield, LogOut } from 'lucide-react';
import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement';

const Settings = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, availableLanguages, getLanguageName, getLanguageFlag } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const handlePasswordChange = () => {
    if (password.new !== password.confirm) {
      toast({
        title: t('common.error'),
        description: t('toast.passwordMismatch.desc'),
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: t('toast.passwordUpdated'),
      description: t('toast.passwordUpdated.desc'),
    });
    setPassword({ current: '', new: '', confirm: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: t('toast.loggedOut'),
      description: t('toast.loggedOut.desc'),
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title={t('settings.title')} />

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Appearance */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    {t('settings.appearance')}
                  </CardTitle>
                  <CardDescription>{t('settings.appearance.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.darkMode')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.darkMode.desc')}
                      </p>
                    </div>
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  </div>
                </CardContent>
              </Card>

              {/* Language */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('settings.language')}
                  </CardTitle>
                  <CardDescription>{t('settings.language.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">{t('settings.language.select')}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('settings.language.current')}: {getLanguageFlag(language)} {getLanguageName(language)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableLanguages.map((lang) => (
                        <Button
                          key={lang}
                          variant={language === lang ? 'default' : 'outline'}
                          className="justify-start h-auto py-3"
                          onClick={() => {
                            setLanguage(lang);
                            toast({
                              title: t('toast.languageChanged'),
                              description: t('toast.languageChanged.desc'),
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getLanguageFlag(lang)}</span>
                            <div className="text-left">
                              <div className="font-medium">{getLanguageName(lang)}</div>
                              <div className="text-xs opacity-70">
                                {lang === 'en' && 'English'}
                                {lang === 'amh' && 'አማርኛ'}
                                {lang === 'orm' && 'Afaan Oromoo'}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t('settings.notifications')}
                  </CardTitle>
                  <CardDescription>{t('settings.notifications.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.email')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.notifications.email.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.push')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.notifications.push.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.sms')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.notifications.sms.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t('settings.security')}
                  </CardTitle>
                  <CardDescription>{t('settings.security.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Two-Factor Authentication</h4>
                    <TwoFactorManagement />
                  </div>

                  <Separator />

                  {/* Password Change */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <div>
                      <Label htmlFor="current-password">{t('settings.security.currentPassword')}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={password.current}
                        onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">{t('settings.security.newPassword')}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={password.new}
                        onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">{t('settings.security.confirmPassword')}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={password.confirm}
                        onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      />
                    </div>
                    <Button onClick={handlePasswordChange}>
                      <Save className="h-4 w-4 mr-2" />
                      {t('settings.security.updatePassword')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card className="shadow-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">{t('settings.dangerZone')}</CardTitle>
                  <CardDescription>{t('settings.dangerZone.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.logout')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
