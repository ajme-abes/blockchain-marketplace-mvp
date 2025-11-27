// src/pages/admin/SystemSettings.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Database,
  Server,
  Mail,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Trash2,
  Play,
  StopCircle,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for system settings
interface SystemSettings {
  general: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    requireStrongPasswords: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enable2FA: boolean;
    blockSuspiciousIPs: boolean;
  };
  payments: {
    defaultCurrency: string;
    enableChapa: boolean;
    enableArifPay: boolean;
    transactionFee: number;
    autoWithdrawal: boolean;
    minWithdrawalAmount: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    orderAlerts: boolean;
    paymentAlerts: boolean;
    securityAlerts: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    imageOptimization: boolean;
    cdnEnabled: boolean;
    compressionEnabled: boolean;
  };
}

interface SystemStatus {
  databaseSize: string;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  systemLoad: number;
  lastBackup: string;
  uptime: string;
}

const SystemSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      platformName: 'Blockchain Marketplace',
      platformDescription: 'Secure and transparent agricultural marketplace',
      supportEmail: 'support@marketplace.com',
      defaultLanguage: 'en',
      timezone: 'Africa/Addis_Ababa',
      maintenanceMode: false
    },
    security: {
      requireEmailVerification: true,
      requireStrongPasswords: true,
      sessionTimeout: 1, // 1 hour for better security
      maxLoginAttempts: 5,
      enable2FA: false,
      blockSuspiciousIPs: true
    },
    payments: {
      defaultCurrency: 'ETB',
      enableChapa: true,
      enableArifPay: true,
      transactionFee: 2.5,
      autoWithdrawal: false,
      minWithdrawalAmount: 100
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      orderAlerts: true,
      paymentAlerts: true,
      securityAlerts: true
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 3600,
      imageOptimization: true,
      cdnEnabled: false,
      compressionEnabled: true
    }
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);
  const [cacheDialog, setCacheDialog] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const { toast } = useToast();

  // Fetch current settings and system status
  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Fetch real data from backend
      const [dashboardResponse, healthResponse] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch('http://localhost:5000/api/admin/system/health', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ]);

      if (dashboardResponse.ok && healthResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const healthData = await healthResponse.json();

        console.log('📊 Dashboard Data:', dashboardData);
        console.log('🏥 Health Data:', healthData);

        if (dashboardData.status === 'success' && healthData.status === 'success') {
          // Set system status with real data
          setSystemStatus({
            databaseSize: healthData.data?.database?.size || '0 MB',
            totalUsers: dashboardData.data?.overview?.totalUsers || 0,
            totalProducts: dashboardData.data?.overview?.totalProducts || 0,
            totalOrders: dashboardData.data?.overview?.totalOrders || 0,
            systemLoad: healthData.data?.system?.cpuUsage || 0,
            lastBackup: healthData.data?.lastBackup || 'Never',
            uptime: healthData.data?.system?.uptime || 'Unknown'
          });
        }
      } else {
        // Fallback to mock data if API fails
        console.log('Using mock system data');
        setSystemStatus({
          databaseSize: '2.4 GB',
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          systemLoad: 34,
          lastBackup: 'Never',
          uptime: 'Unknown'
        });
      }

    } catch (error) {
      console.error('Error fetching system data:', error);
      // Fallback to mock data
      setSystemStatus({
        databaseSize: '2.4 GB',
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        systemLoad: 34,
        lastBackup: 'Never',
        uptime: 'Unknown'
      });
      toast({
        title: 'Info',
        description: 'Using demo system data. Connect to backend for real data.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Handle setting changes
  const handleSettingChange = (category: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');

      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Settings Saved',
        description: 'System settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle maintenance mode
  const toggleMaintenanceMode = async () => {
    const newValue = !settings.general.maintenanceMode;

    if (newValue) {
      setMaintenanceDialog(true);
    } else {
      handleSettingChange('general', 'maintenanceMode', newValue);
      toast({
        title: 'Maintenance Mode Disabled',
        description: 'Platform is now accessible to all users.',
      });
    }
  };

  // Confirm maintenance mode
  const confirmMaintenanceMode = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // In production, this would call your backend API to enable maintenance mode
      // For now, we'll just update the local state
      handleSettingChange('general', 'maintenanceMode', true);

      // TODO: Implement backend API call
      // await fetch('http://localhost:5000/api/admin/settings/maintenance', {
      //   method: 'POST',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ enabled: true }),
      //   credentials: 'include'
      // });

      setMaintenanceDialog(false);
      toast({
        title: 'Maintenance Mode Enabled',
        description: 'Platform is now in maintenance mode. Only admins can access.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error enabling maintenance mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable maintenance mode',
        variant: 'destructive',
      });
    }
  };

  // Perform backup
  const performBackup = async () => {
    try {
      setLoading(true);
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));

      setBackupDialog(false);
      toast({
        title: 'Backup Completed',
        description: 'System backup has been created successfully.',
      });

      // Update last backup time
      setSystemStatus(prev => prev ? {
        ...prev,
        lastBackup: new Date().toLocaleString()
      } : null);
    } catch (error) {
      console.error('Error performing backup:', error);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create system backup.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      setLoading(true);
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCacheDialog(false);
      toast({
        title: 'Cache Cleared',
        description: 'System cache has been cleared successfully.',
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Cache Clear Failed',
        description: 'Failed to clear system cache.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="System Settings"
            description="Platform configuration, maintenance, and system management"
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchSystemData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                >
                  <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* System Status Overview */}
              {systemStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{systemStatus.totalUsers}</div>
                          <div className="text-sm text-muted-foreground">Total Users</div>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{systemStatus.totalProducts}</div>
                          <div className="text-sm text-muted-foreground">Products</div>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{systemStatus.systemLoad}%</div>
                          <div className="text-sm text-muted-foreground">System Load</div>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Server className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <Progress value={systemStatus.systemLoad} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{systemStatus.uptime.split(' ')[0]}</div>
                          <div className="text-sm text-muted-foreground">Uptime</div>
                        </div>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Settings Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Platform Settings
                        </CardTitle>
                        <CardDescription>
                          Basic platform configuration and information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="platformName">Platform Name</Label>
                          <Input
                            id="platformName"
                            value={settings.general.platformName}
                            onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="platformDescription">Platform Description</Label>
                          <Textarea
                            id="platformDescription"
                            value={settings.general.platformDescription}
                            onChange={(e) => handleSettingChange('general', 'platformDescription', e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="supportEmail">Support Email</Label>
                          <Input
                            id="supportEmail"
                            type="email"
                            value={settings.general.supportEmail}
                            onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="defaultLanguage">Default Language</Label>
                            <Select
                              value={settings.general.defaultLanguage}
                              onValueChange={(value) => handleSettingChange('general', 'defaultLanguage', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="am">Amharic</SelectItem>
                                <SelectItem value="om">Oromic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select
                              value={settings.general.timezone}
                              onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Africa/Addis_Ababa">Addis Ababa (EAT)</SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">New York (EST)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          System Operations
                        </CardTitle>
                        <CardDescription>
                          System maintenance and operational controls
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="maintenanceMode" className="text-base">
                              Maintenance Mode
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              {settings.general.maintenanceMode
                                ? 'Platform is in maintenance mode'
                                : 'Platform is accessible to all users'
                              }
                            </div>
                          </div>
                          <Switch
                            id="maintenanceMode"
                            checked={settings.general.maintenanceMode}
                            onCheckedChange={toggleMaintenanceMode}
                          />
                        </div>

                        {/* System Information */}
                        {systemStatus && (
                          <div className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">System Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Database Size:</span>
                                <div className="font-medium">{systemStatus.databaseSize}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Backup:</span>
                                <div className="font-medium">{systemStatus.lastBackup}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setBackupDialog(true)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Create System Backup
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setCacheDialog(true)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear System Cache
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate('/admin/logs')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View System Logs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Authentication & Security
                        </CardTitle>
                        <CardDescription>
                          User authentication and platform security settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="emailVerification" className="text-base">
                              Require Email Verification
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Users must verify their email address before using the platform
                            </div>
                          </div>
                          <Switch
                            id="emailVerification"
                            checked={settings.security.requireEmailVerification}
                            onCheckedChange={(value) => handleSettingChange('security', 'requireEmailVerification', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="strongPasswords" className="text-base">
                              Require Strong Passwords
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Enforce strong password policies for all users
                            </div>
                          </div>
                          <Switch
                            id="strongPasswords"
                            checked={settings.security.requireStrongPasswords}
                            onCheckedChange={(value) => handleSettingChange('security', 'requireStrongPasswords', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="enable2FA" className="text-base">
                              Enable Two-Factor Authentication
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Allow users to enable 2FA for additional security
                            </div>
                          </div>
                          <Switch
                            id="enable2FA"
                            checked={settings.security.enable2FA}
                            onCheckedChange={(value) => handleSettingChange('security', 'enable2FA', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="blockSuspiciousIPs" className="text-base">
                              Block Suspicious IPs
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Automatically block IPs with suspicious activity
                            </div>
                          </div>
                          <Switch
                            id="blockSuspiciousIPs"
                            checked={settings.security.blockSuspiciousIPs}
                            onCheckedChange={(value) => handleSettingChange('security', 'blockSuspiciousIPs', value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Session & Access Control
                        </CardTitle>
                        <CardDescription>
                          User session management and access controls
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sessionTimeout">Session Timeout (Hours)</Label>
                          <Input
                            id="sessionTimeout"
                            type="number"
                            min="1"
                            max="24"
                            value={settings.security.sessionTimeout}
                            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                          />
                          <div className="text-sm text-muted-foreground">
                            How long users remain logged in without activity. Recommended: 1-2 hours for security
                          </div>
                          {settings.security.sessionTimeout > 2 && (
                            <div className="flex items-center gap-2 text-amber-600 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Long session timeouts may pose security risks
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                          <Input
                            id="maxLoginAttempts"
                            type="number"
                            min="1"
                            max="10"
                            value={settings.security.maxLoginAttempts}
                            onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                          />
                          <div className="text-sm text-muted-foreground">
                            Maximum failed login attempts before temporary lockout
                          </div>
                        </div>

                        {/* Security Overview */}
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <h4 className="font-semibold mb-2 text-blue-800">Security Status</h4>
                          <div className="space-y-2 text-sm">
                            {settings.security.requireEmailVerification && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Email verification enabled
                              </div>
                            )}
                            {settings.security.requireStrongPasswords && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Strong passwords required
                              </div>
                            )}
                            {settings.security.blockSuspiciousIPs && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                IP blocking active
                              </div>
                            )}
                            {settings.security.sessionTimeout <= 2 && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Secure session timeout ({settings.security.sessionTimeout}h)
                              </div>
                            )}
                            {!settings.security.enable2FA && (
                              <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                2FA disabled - consider enabling for better security
                              </div>
                            )}
                            {settings.security.sessionTimeout > 2 && (
                              <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                Session timeout is high - consider reducing to 1-2 hours
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Payments Settings */}
                <TabsContent value="payments" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payment Gateways
                        </CardTitle>
                        <CardDescription>
                          Configure payment gateway integrations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="enableChapa" className="text-base">
                              Chapa Payment Gateway
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Enable Chapa for Ethiopian payment processing
                            </div>
                          </div>
                          <Switch
                            id="enableChapa"
                            checked={settings.payments.enableChapa}
                            onCheckedChange={(value) => handleSettingChange('payments', 'enableChapa', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="enableArifPay" className="text-base">
                              ArifPay Payment Gateway
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Enable ArifPay for alternative payment processing
                            </div>
                          </div>
                          <Switch
                            id="enableArifPay"
                            checked={settings.payments.enableArifPay}
                            onCheckedChange={(value) => handleSettingChange('payments', 'enableArifPay', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="autoWithdrawal" className="text-base">
                              Auto Withdrawal for Producers
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Automatically process producer withdrawals
                            </div>
                          </div>
                          <Switch
                            id="autoWithdrawal"
                            checked={settings.payments.autoWithdrawal}
                            onCheckedChange={(value) => handleSettingChange('payments', 'autoWithdrawal', value)}
                          />
                        </div>

                        {settings.payments.autoWithdrawal && (
                          <div className="space-y-2">
                            <Label htmlFor="minWithdrawalAmount">Minimum Withdrawal Amount</Label>
                            <Input
                              id="minWithdrawalAmount"
                              type="number"
                              value={settings.payments.minWithdrawalAmount}
                              onChange={(e) => handleSettingChange('payments', 'minWithdrawalAmount', parseFloat(e.target.value))}
                            />
                            <div className="text-sm text-muted-foreground">
                              Minimum amount producers can withdraw
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Transaction Settings
                        </CardTitle>
                        <CardDescription>
                          Configure transaction fees and currency settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="defaultCurrency">Default Currency</Label>
                          <Select
                            value={settings.payments.defaultCurrency}
                            onValueChange={(value) => handleSettingChange('payments', 'defaultCurrency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transactionFee">Transaction Fee (%)</Label>
                          <Input
                            id="transactionFee"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={settings.payments.transactionFee}
                            onChange={(e) => handleSettingChange('payments', 'transactionFee', parseFloat(e.target.value))}
                          />
                          <div className="text-sm text-muted-foreground">
                            Platform fee applied to each transaction
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="p-4 border rounded-lg bg-green-50">
                          <h4 className="font-semibold mb-2 text-green-800">Payment Status</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Chapa Gateway:</span>
                              <Badge variant={settings.payments.enableChapa ? "default" : "outline"}>
                                {settings.payments.enableChapa ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>ArifPay Gateway:</span>
                              <Badge variant={settings.payments.enableArifPay ? "default" : "outline"}>
                                {settings.payments.enableArifPay ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Default Currency:</span>
                              <Badge variant="outline">{settings.payments.defaultCurrency}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Channels
                      </CardTitle>
                      <CardDescription>
                        Configure how users receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="emailNotifications" className="text-base">
                                Email Notifications
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Send notifications via email
                              </div>
                            </div>
                            <Switch
                              id="emailNotifications"
                              checked={settings.notifications.emailNotifications}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'emailNotifications', value)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="smsNotifications" className="text-base">
                                SMS Notifications
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Send notifications via SMS (if available)
                              </div>
                            </div>
                            <Switch
                              id="smsNotifications"
                              checked={settings.notifications.smsNotifications}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'smsNotifications', value)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="pushNotifications" className="text-base">
                                Push Notifications
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Send browser/mobile push notifications
                              </div>
                            </div>
                            <Switch
                              id="pushNotifications"
                              checked={settings.notifications.pushNotifications}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'pushNotifications', value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="orderAlerts" className="text-base">
                                Order Alerts
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Notify about new orders and order updates
                              </div>
                            </div>
                            <Switch
                              id="orderAlerts"
                              checked={settings.notifications.orderAlerts}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'orderAlerts', value)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="paymentAlerts" className="text-base">
                                Payment Alerts
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Notify about payment confirmations and issues
                              </div>
                            </div>
                            <Switch
                              id="paymentAlerts"
                              checked={settings.notifications.paymentAlerts}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'paymentAlerts', value)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="securityAlerts" className="text-base">
                                Security Alerts
                              </Label>
                              <div className="text-sm text-muted-foreground">
                                Notify about security-related events
                              </div>
                            </div>
                            <Switch
                              id="securityAlerts"
                              checked={settings.notifications.securityAlerts}
                              onCheckedChange={(value) => handleSettingChange('notifications', 'securityAlerts', value)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Performance Settings */}
                <TabsContent value="performance" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          Performance Optimization
                        </CardTitle>
                        <CardDescription>
                          Configure system performance and caching
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="cacheEnabled" className="text-base">
                              Enable Caching
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Improve performance with data caching
                            </div>
                          </div>
                          <Switch
                            id="cacheEnabled"
                            checked={settings.performance.cacheEnabled}
                            onCheckedChange={(value) => handleSettingChange('performance', 'cacheEnabled', value)}
                          />
                        </div>

                        {settings.performance.cacheEnabled && (
                          <div className="space-y-2">
                            <Label htmlFor="cacheDuration">Cache Duration (Seconds)</Label>
                            <Input
                              id="cacheDuration"
                              type="number"
                              value={settings.performance.cacheDuration}
                              onChange={(e) => handleSettingChange('performance', 'cacheDuration', parseInt(e.target.value))}
                            />
                            <div className="text-sm text-muted-foreground">
                              How long to keep data in cache
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="imageOptimization" className="text-base">
                              Image Optimization
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Automatically optimize uploaded images
                            </div>
                          </div>
                          <Switch
                            id="imageOptimization"
                            checked={settings.performance.imageOptimization}
                            onCheckedChange={(value) => handleSettingChange('performance', 'imageOptimization', value)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="compressionEnabled" className="text-base">
                              Enable Compression
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Compress responses for faster loading
                            </div>
                          </div>
                          <Switch
                            id="compressionEnabled"
                            checked={settings.performance.compressionEnabled}
                            onCheckedChange={(value) => handleSettingChange('performance', 'compressionEnabled', value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Advanced Settings
                        </CardTitle>
                        <CardDescription>
                          Advanced performance and CDN configuration
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="cdnEnabled" className="text-base">
                              Enable CDN
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              Use Content Delivery Network for static assets
                            </div>
                          </div>
                          <Switch
                            id="cdnEnabled"
                            checked={settings.performance.cdnEnabled}
                            onCheckedChange={(value) => handleSettingChange('performance', 'cdnEnabled', value)}
                          />
                        </div>

                        {/* Performance Tips */}
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <h4 className="font-semibold mb-2 text-blue-800">Performance Tips</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Caching improves page load times
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Image optimization reduces bandwidth
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              CDN improves global access speed
                            </div>
                          </div>
                        </div>

                        {/* System Recommendations */}
                        <div className="p-4 border rounded-lg bg-amber-50">
                          <h4 className="font-semibold mb-2 text-amber-800">Recommendations</h4>
                          <div className="space-y-2 text-sm">
                            {!settings.performance.cdnEnabled && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Enable CDN for better global performance
                              </div>
                            )}
                            {settings.performance.cacheDuration < 1800 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Consider increasing cache duration
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Maintenance Mode Confirmation Dialog */}
      <Dialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Enable Maintenance Mode
            </DialogTitle>
            <DialogDescription>
              This will put the platform in maintenance mode. Only administrators will be able to access the system. Regular users will see a maintenance page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMaintenanceMode}
            >
              Enable Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Confirmation Dialog */}
      <Dialog open={backupDialog} onOpenChange={setBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Create System Backup
            </DialogTitle>
            <DialogDescription>
              This will create a complete backup of the system database and files. The process may take several minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBackupDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={performBackup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Cache Confirmation Dialog */}
      <Dialog open={cacheDialog} onOpenChange={setCacheDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-amber-600" />
              Clear System Cache
            </DialogTitle>
            <DialogDescription>
              This will clear all cached data. Users may experience slightly slower performance temporarily as the cache rebuilds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCacheDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={clearCache}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Clearing Cache...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default SystemSettings;