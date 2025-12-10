// src/pages/admin/SystemMonitor.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Shield,
  Mail,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Activity,
  Bell,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for system monitoring
interface SystemHealth {
  database: string;
  blockchain: string;
  paymentGateway: string;
  emailService: string;
  uptime: number;
  timestamp: string;
}

interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  resolved?: boolean;
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  responseTime: number;
  requestCount: number;
}

interface MonitorResponse {
  data: {
    systemHealth: SystemHealth;
    alerts: SystemAlert[];
    metrics: PerformanceMetrics;
  };
}

const SystemMonitor = () => {
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Fetch system health and alerts
  const fetchSystemMonitor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Fetch system health
      const healthResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/system/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Fetch alerts from dashboard stats
      const alertsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (healthResponse.ok && alertsResponse.ok) {
        const healthResult = await healthResponse.json();
        const alertsResult = await alertsResponse.json();

        console.log('🖥️ System Health Response:', healthResult);
        console.log('🚨 Alerts Response:', alertsResult);

        // Set system health
        if (healthResult.status === 'success') {
          setSystemHealth(healthResult.data);
        }

        // Set alerts from dashboard or create default alerts
        if (alertsResult.status === 'success') {
          const systemAlerts = alertsResult.data?.systemAlertsList || generateDefaultAlerts(healthResult.data);
          setAlerts(systemAlerts);
        }

        // Fetch real performance metrics
        const performanceMetrics = await fetchPerformanceMetrics();
        setMetrics(performanceMetrics);

        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch system monitor data');
        toast({
          title: 'Error',
          description: 'Failed to load system monitor data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching system monitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system monitor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate default alerts based on system health
  const generateDefaultAlerts = (health: SystemHealth): SystemAlert[] => {
    const alerts: SystemAlert[] = [];
    const now = new Date().toISOString();

    if (health.database !== 'healthy') {
      alerts.push({
        id: 'db-health',
        title: 'Database Health Issue',
        description: `Database status: ${health.database}. This may affect platform functionality.`,
        severity: health.database === 'unhealthy' ? 'HIGH' : 'MEDIUM',
        timestamp: now
      });
    }

    if (health.blockchain !== 'connected') {
      alerts.push({
        id: 'blockchain-conn',
        title: 'Blockchain Connection Issue',
        description: `Blockchain status: ${health.blockchain}. Transaction verification may be delayed.`,
        severity: 'MEDIUM',
        timestamp: now
      });
    }

    if (health.paymentGateway !== 'healthy') {
      alerts.push({
        id: 'payment-health',
        title: 'Payment Gateway Issue',
        description: `Payment gateway status: ${health.paymentGateway}. Payment processing may be affected.`,
        severity: 'HIGH',
        timestamp: now
      });
    }

    // Add system optimal alert if no issues
    if (alerts.length === 0) {
      alerts.push({
        id: 'system-optimal',
        title: 'System Performance Optimal',
        description: 'All systems operating within normal parameters. Platform is healthy.',
        severity: 'LOW',
        timestamp: now
      });
    }

    return alerts;
  };

  // Fetch performance metrics from backend (real implementation needed)
  const fetchPerformanceMetrics = async (): Promise<PerformanceMetrics | null> => {
    try {
      const token = localStorage.getItem('authToken');

      // TODO: Implement real performance metrics endpoint
      // const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/system/metrics`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   credentials: 'include'
      // });

      // if (response.ok) {
      //   const result = await response.json();
      //   return result.data;
      // }

      // For now, return null to indicate metrics are not available
      return null;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return null;
    }
  };

  // Handle alert resolution
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));

    toast({
      title: 'Alert Resolved',
      description: 'The alert has been marked as resolved.',
    });
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      healthy: { variant: 'default' as const, className: 'bg-green-500', icon: CheckCircle, label: 'Healthy' },
      connected: { variant: 'default' as const, className: 'bg-green-500', icon: CheckCircle, label: 'Connected' },
      unhealthy: { variant: 'destructive' as const, className: 'bg-red-500', icon: XCircle, label: 'Unhealthy' },
      disconnected: { variant: 'destructive' as const, className: 'bg-red-500', icon: XCircle, label: 'Disconnected' },
      error: { variant: 'destructive' as const, className: 'bg-red-500', icon: XCircle, label: 'Error' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
      { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: AlertTriangle, label: status };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get alert severity badge
  const getAlertSeverityBadge = (severity: string) => {
    const severityConfig = {
      CRITICAL: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Critical' },
      HIGH: { variant: 'destructive' as const, className: 'bg-orange-500', label: 'High' },
      MEDIUM: { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Medium' },
      LOW: { variant: 'outline' as const, className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: 'Low' }
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.LOW;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchSystemMonitor();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemMonitor, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Calculate system health score
  const calculateHealthScore = (): number => {
    if (!systemHealth) return 0;

    let score = 100;

    // Deduct points for each unhealthy service
    if (systemHealth.database !== 'healthy') score -= 25;
    if (systemHealth.blockchain !== 'connected') score -= 20;
    if (systemHealth.paymentGateway !== 'healthy') score -= 25;
    if (systemHealth.emailService !== 'healthy') score -= 10;

    return Math.max(score, 0);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="System Monitor"
            description="Real-time system health monitoring and performance metrics"
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchSystemMonitor}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* System Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{calculateHealthScore()}%</div>
                        <div className="text-sm text-muted-foreground">Health Score</div>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <Progress value={calculateHealthScore()} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {systemHealth ? formatUptime(systemHealth.uptime) : '0m'}
                        </div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Critical Alerts</div>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {metrics?.activeConnections || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Connections</div>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Network className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Monitoring Content */}
              <Tabs defaultValue="health" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="health">System Health</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="logs">Event Logs</TabsTrigger>
                </TabsList>

                {/* System Health Tab */}
                <TabsContent value="health" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Service Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          Service Status
                        </CardTitle>
                        <CardDescription>
                          Current status of all platform services
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : systemHealth ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium">Database</div>
                                  <div className="text-sm text-muted-foreground">PostgreSQL</div>
                                </div>
                              </div>
                              {getStatusBadge(systemHealth.database)}
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-600" />
                                <div>
                                  <div className="font-medium">Blockchain</div>
                                  <div className="text-sm text-muted-foreground">Polygon Network</div>
                                </div>
                              </div>
                              {getStatusBadge(systemHealth.blockchain)}
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-purple-600" />
                                <div>
                                  <div className="font-medium">Payment Gateway</div>
                                  <div className="text-sm text-muted-foreground">Chapa Integration</div>
                                </div>
                              </div>
                              {getStatusBadge(systemHealth.paymentGateway)}
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-orange-600" />
                                <div>
                                  <div className="font-medium">Email Service</div>
                                  <div className="text-sm text-muted-foreground">Notifications</div>
                                </div>
                              </div>
                              {getStatusBadge(systemHealth.emailService)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground">
                            No health data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* System Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="h-5 w-5" />
                          System Information
                        </CardTitle>
                        <CardDescription>
                          Platform configuration and details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Platform Version</span>
                            <span className="font-medium">v1.0.0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Environment</span>
                            <Badge variant="outline">Production</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Last Updated</span>
                            <span className="font-medium text-sm">
                              {lastUpdate.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Auto Refresh</span>
                            <Badge variant={autoRefresh ? "default" : "outline"}>
                              {autoRefresh ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3">Quick Actions</h4>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Clear Cache
                              </Button>
                              <Button variant="outline" className="w-full justify-start" size="sm">
                                <Database className="h-4 w-4 mr-2" />
                                Run Database Backup
                              </Button>
                              <Button variant="outline" className="w-full justify-start" size="sm">
                                <Shield className="h-4 w-4 mr-2" />
                                Security Scan
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        System Alerts
                        <Badge variant="outline" className="ml-2">
                          {alerts.filter(a => !a.resolved).length} Active
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Real-time alerts and notifications from system monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex justify-center items-center h-48">
                          <RefreshCw className="h-8 w-8 animate-spin" />
                        </div>
                      ) : alerts.length > 0 ? (
                        <div className="space-y-4">
                          {alerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={`p-4 border rounded-lg ${alert.resolved
                                ? 'bg-gray-50 border-gray-200'
                                : alert.severity === 'CRITICAL'
                                  ? 'bg-red-50 border-red-200'
                                  : alert.severity === 'HIGH'
                                    ? 'bg-orange-50 border-orange-200'
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`font-semibold ${alert.resolved ? 'text-gray-600' :
                                      alert.severity === 'CRITICAL' ? 'text-red-800' :
                                        alert.severity === 'HIGH' ? 'text-orange-800' : 'text-blue-800'
                                      }`}>
                                      {alert.title}
                                    </h4>
                                    {getAlertSeverityBadge(alert.severity)}
                                    {alert.resolved && (
                                      <Badge variant="outline" className="bg-gray-500/10">
                                        Resolved
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={`text-sm ${alert.resolved ? 'text-gray-600' :
                                    alert.severity === 'CRITICAL' ? 'text-red-700' :
                                      alert.severity === 'HIGH' ? 'text-orange-700' : 'text-blue-700'
                                    }`}>
                                    {alert.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                    {!alert.resolved && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => resolveAlert(alert.id)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        Mark Resolved
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {!alert.resolved && (
                                  <AlertCircle className={`h-5 w-5 ${alert.severity === 'CRITICAL' ? 'text-red-600' :
                                    alert.severity === 'HIGH' ? 'text-orange-600' : 'text-blue-600'
                                    }`} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
                          <div>No active alerts</div>
                          <div className="text-sm">All systems are operating normally</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Resource Usage
                        </CardTitle>
                        <CardDescription>
                          Current system resource utilization
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : metrics ? (
                          <div className="space-y-6">
                            {/* CPU Usage */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  <Cpu className="h-4 w-4 text-blue-600" />
                                  CPU Usage
                                </span>
                                <span className="text-sm font-bold">{metrics.cpuUsage.toFixed(1)}%</span>
                              </div>
                              <Progress value={metrics.cpuUsage} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {metrics.cpuUsage < 50 ? 'Optimal' : metrics.cpuUsage < 80 ? 'Moderate' : 'High'} load
                              </div>
                            </div>

                            {/* Memory Usage */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  <HardDrive className="h-4 w-4 text-green-600" />
                                  Memory Usage
                                </span>
                                <span className="text-sm font-bold">{metrics.memoryUsage.toFixed(1)}%</span>
                              </div>
                              <Progress value={metrics.memoryUsage} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {metrics.memoryUsage < 60 ? 'Healthy' : metrics.memoryUsage < 85 ? 'Moderate' : 'High'} usage
                              </div>
                            </div>

                            {/* Disk Usage */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  <HardDrive className="h-4 w-4 text-purple-600" />
                                  Disk Usage
                                </span>
                                <span className="text-sm font-bold">{metrics.diskUsage.toFixed(1)}%</span>
                              </div>
                              <Progress value={metrics.diskUsage} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {metrics.diskUsage < 70 ? 'Sufficient' : metrics.diskUsage < 90 ? 'Moderate' : 'Low'} space
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Activity className="h-12 w-12 mb-4 opacity-50" />
                            <div className="text-lg font-medium">Performance Monitoring Unavailable</div>
                            <div className="text-sm text-center max-w-md">
                              Real-time performance metrics are not currently available.
                              This feature requires additional backend monitoring infrastructure.
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchSystemMonitor}
                              className="mt-4"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Check Again
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-5 w-5" />
                          Network & Performance
                        </CardTitle>
                        <CardDescription>
                          Network metrics and response times
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : metrics ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{metrics.activeConnections}</div>
                                <div className="text-sm text-muted-foreground">Active Connections</div>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{metrics.responseTime}ms</div>
                                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                              </div>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {metrics.requestCount.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">Requests Today</div>
                            </div>

                            <div className="pt-4 border-t">
                              <h4 className="font-semibold mb-3">Performance Status</h4>
                              <div className="space-y-2 text-sm">
                                {metrics.responseTime < 100 && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Response times are excellent
                                  </div>
                                )}
                                {metrics.cpuUsage < 70 && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    CPU usage is optimal
                                  </div>
                                )}
                                {metrics.activeConnections < 100 && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Connection load is healthy
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Network className="h-12 w-12 mb-4 opacity-50" />
                            <div className="text-lg font-medium">Network Monitoring Unavailable</div>
                            <div className="text-sm text-center max-w-md">
                              Network performance metrics are not currently available.
                              This feature requires additional monitoring infrastructure.
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Event Logs Tab */}
                <TabsContent value="logs">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent System Events
                      </CardTitle>
                      <CardDescription>
                        Latest system events and activities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Static event logs - replace with real data from your backend */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">System Health Check</div>
                              <div className="text-sm text-muted-foreground">All services operational</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Cache Refreshed</div>
                              <div className="text-sm text-muted-foreground">System cache cleared and rebuilt</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(Date.now() - 300000).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">Security Scan</div>
                              <div className="text-sm text-muted-foreground">No vulnerabilities detected</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(Date.now() - 1800000).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <div>Real-time event logging coming soon</div>
                          <div className="text-sm">This will display live system events and activities</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SystemMonitor;