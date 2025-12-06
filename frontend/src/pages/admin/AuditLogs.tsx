// src/pages/admin/AuditLogs.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Shield,
  FileText,
  Settings,
  ShoppingCart,
  Package,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for audit log data
interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    actions: string[];
    entities: string[];
    users: string[];
  };
}

const AuditLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: 'all',
    entity: 'all',
    user: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    actions: [],
    entities: [],
    users: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  // Fetch audit logs
  const fetchAuditLogs = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (search) {
        params.append('search', search);
      }
      if (filters.action !== 'all') {
        params.append('action', filters.action);
      }
      if (filters.entity !== 'all') {
        params.append('entity', filters.entity);
      }
      if (filters.user !== 'all') {
        params.append('userId', filters.user);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      // For now, we'll use mock data since the audit logs endpoint might not be ready
      // Replace this URL with your actual audit logs endpoint when available
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setLogs(result.data.logs || generateMockAuditLogs());
          setPagination(result.data.pagination || {
            page: 1,
            limit: 20,
            total: result.data.logs?.length || 0,
            pages: 1
          });
          setAvailableFilters(result.data.filters || {
            actions: ['USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'PAYMENT_PROCESSED'],
            entities: ['USER', 'PRODUCT', 'ORDER', 'PAYMENT', 'SYSTEM'],
            users: ['Admin User', 'System']
          });
        }
      } else {
        // Fallback to mock data if endpoint not available
        console.log('Using mock audit logs data');
        setLogs(generateMockAuditLogs());
        setPagination({
          page: 1,
          limit: 20,
          total: 50,
          pages: 3
        });
        setAvailableFilters({
          actions: ['USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'PAYMENT_PROCESSED'],
          entities: ['USER', 'PRODUCT', 'ORDER', 'PAYMENT', 'SYSTEM'],
          users: ['Admin User', 'System']
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      // Fallback to mock data
      setLogs(generateMockAuditLogs());
      setPagination({
        page: 1,
        limit: 20,
        total: 50,
        pages: 3
      });
      toast({
        title: 'Info',
        description: 'Using demo audit logs data. Connect to backend for real data.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock audit logs for demonstration
  const generateMockAuditLogs = (): AuditLog[] => {
    const actions = [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED',
      'PAYMENT_PROCESSED', 'PAYMENT_REFUNDED', 'SETTINGS_UPDATED'
    ];

    const entities = ['USER', 'PRODUCT', 'ORDER', 'PAYMENT', 'SYSTEM'];
    const users = [
      { id: '1', name: 'Admin User', email: 'admin@marketplace.com', role: 'ADMIN' },
      { id: '2', name: 'System', email: 'system@marketplace.com', role: 'SYSTEM' },
      { id: '3', name: 'Producer User', email: 'producer@example.com', role: 'PRODUCER' }
    ];

    const logs: AuditLog[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomEntity = entities[Math.floor(Math.random() * entities.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      logs.push({
        id: `log-${i + 1}`,
        action: randomAction,
        entity: randomEntity,
        entityId: `entity-${Math.floor(Math.random() * 1000)}`,
        userId: randomUser.id,
        user: randomUser,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        oldValues: Math.random() > 0.7 ? { status: 'old-value' } : undefined,
        newValues: Math.random() > 0.7 ? { status: 'new-value' } : undefined
      });
    }

    // Sort by timestamp descending
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters.action, filters.entity, filters.user, filters.dateFrom, filters.dateTo]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    fetchAuditLogs(1, value);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Format action for display
  const formatAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'USER_LOGIN': 'User Login',
      'USER_LOGOUT': 'User Logout',
      'USER_CREATED': 'User Created',
      'USER_UPDATED': 'User Updated',
      'USER_DELETED': 'User Deleted',
      'PRODUCT_CREATED': 'Product Created',
      'PRODUCT_UPDATED': 'Product Updated',
      'PRODUCT_DELETED': 'Product Deleted',
      'ORDER_CREATED': 'Order Created',
      'ORDER_UPDATED': 'Order Updated',
      'ORDER_CANCELLED': 'Order Cancelled',
      'PAYMENT_PROCESSED': 'Payment Processed',
      'PAYMENT_REFUNDED': 'Payment Refunded',
      'SETTINGS_UPDATED': 'Settings Updated'
    };

    return actionMap[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return User;
    if (action.includes('PRODUCT')) return Package;
    if (action.includes('ORDER')) return ShoppingCart;
    if (action.includes('PAYMENT')) return CreditCard;
    if (action.includes('SETTINGS')) return Settings;
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return Shield;
    return FileText;
  };

  // Get action badge color
  const getActionBadge = (action: string) => {
    const actionConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", className: string } } = {
      'USER_CREATED': { variant: 'default', className: 'bg-green-500' },
      'PRODUCT_CREATED': { variant: 'default', className: 'bg-blue-500' },
      'ORDER_CREATED': { variant: 'default', className: 'bg-purple-500' },
      'PAYMENT_PROCESSED': { variant: 'default', className: 'bg-emerald-500' },
      'USER_DELETED': { variant: 'destructive', className: 'bg-red-500' },
      'PRODUCT_DELETED': { variant: 'destructive', className: 'bg-red-500' },
      'ORDER_CANCELLED': { variant: 'destructive', className: 'bg-red-500' },
      'USER_LOGIN': { variant: 'outline', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      'USER_LOGOUT': { variant: 'outline', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' }
    };

    const config = actionConfig[action] || { variant: 'outline', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
    const IconComponent = getActionIcon(action);

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {formatAction(action)}
      </Badge>
    );
  };

  // Get entity badge
  const getEntityBadge = (entity: string) => {
    const entityConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", className: string } } = {
      'USER': { variant: 'outline', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      'PRODUCT': { variant: 'outline', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      'ORDER': { variant: 'outline', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
      'PAYMENT': { variant: 'outline', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
      'SYSTEM': { variant: 'outline', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' }
    };

    const config = entityConfig[entity] || { variant: 'outline', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };

    return (
      <Badge variant={config.variant} className={config.className}>
        {entity}
      </Badge>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format JSON for display
  const formatJson = (obj: any) => {
    if (!obj) return 'No data';
    return JSON.stringify(obj, null, 2);
  };

  // Export logs to CSV
  const exportLogs = () => {
    if (logs.length === 0) {
      toast({
        title: 'No Data',
        description: 'No logs available to export',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Export Started',
      description: 'Generating audit logs export...',
    });

    // Create CSV header
    let csv = 'Timestamp,Action,Entity,Entity ID,User,User Role,IP Address,Old Values,New Values\n';

    // Add each log entry
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const action = formatAction(log.action);
      const entity = log.entity;
      const entityId = log.entityId;
      const userName = log.user?.name || 'System';
      const userRole = log.user?.role || 'SYSTEM';
      const ipAddress = log.ipAddress || 'N/A';
      const oldValues = log.oldValues ? JSON.stringify(log.oldValues).replace(/"/g, '""') : 'N/A';
      const newValues = log.newValues ? JSON.stringify(log.newValues).replace(/"/g, '""') : 'N/A';

      csv += `"${timestamp}","${action}","${entity}","${entityId}","${userName}","${userRole}","${ipAddress}","${oldValues}","${newValues}"\n`;
    });

    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${logs.length} audit logs to CSV`,
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="Audit Logs"
            description="Comprehensive activity tracking and security monitoring"
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fetchAuditLogs(1, filters.search)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={exportLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{pagination.total}</div>
                        <div className="text-sm text-muted-foreground">Total Logs</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {new Set(logs.map(log => log.userId)).size}
                        </div>
                        <div className="text-sm text-muted-foreground">Unique Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {availableFilters.actions.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Action Types</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">24/7</div>
                        <div className="text-sm text-muted-foreground">Monitoring</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search logs by action, entity, user, or IP..."
                        value={filters.search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                        <SelectTrigger className="w-[160px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Action Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          {availableFilters.actions.map((action) => (
                            <SelectItem key={action} value={action}>
                              {formatAction(action)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.entity} onValueChange={(value) => handleFilterChange('entity', value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Entity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Entities</SelectItem>
                          {availableFilters.entities.map((entity) => (
                            <SelectItem key={entity} value={entity}>
                              {entity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.user} onValueChange={(value) => handleFilterChange('user', value)}>
                        <SelectTrigger className="w-[160px]">
                          <User className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="User" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {availableFilters.users.map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Input
                          type="date"
                          placeholder="From Date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="w-[140px]"
                        />
                        <Input
                          type="date"
                          placeholder="To Date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-[140px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Logs Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Activity Logs ({pagination.total})
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                        {logs.filter(l => l.entity === 'USER').length} User Actions
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        {logs.filter(l => l.entity === 'PRODUCT').length} Product Actions
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading audit logs...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Entity</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs.length > 0 ? (
                              logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    {getActionBadge(log.action)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getEntityBadge(log.entity)}
                                      <span className="text-sm text-muted-foreground font-mono">
                                        {log.entityId.slice(0, 8)}...
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{log.user?.name || 'System'}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {log.user?.role || 'SYSTEM'}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-sm">{log.ipAddress}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {formatTimestamp(log.timestamp)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedLog(log);
                                          setDetailOpen(true);
                                        }}
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedLog(log);
                                              setDetailOpen(true);
                                            }}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              // Implement investigate action
                                              toast({
                                                title: 'Investigation Started',
                                                description: `Investigating log entry: ${log.id}`,
                                              });
                                            }}
                                          >
                                            <Shield className="h-4 w-4 mr-2" />
                                            Investigate
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <div>No audit logs found</div>
                                  {filters.search && (
                                    <div className="text-sm mt-2">Try adjusting your search or filters</div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {pagination.pages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAuditLogs(pagination.page - 1, filters.search)}
                              disabled={pagination.page === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAuditLogs(pagination.page + 1, filters.search)}
                              disabled={pagination.page === pagination.pages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this activity log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Action Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Action:</span>
                      {getActionBadge(selectedLog.action)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entity:</span>
                      {getEntityBadge(selectedLog.entity)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entity ID:</span>
                      <span className="font-mono">{selectedLog.entityId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User:</span>
                      <span>{selectedLog.user?.name || 'System'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedLog.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span>{selectedLog.user?.role || 'SYSTEM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono">{selectedLog.ipAddress || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Change Details */}
              {(selectedLog.oldValues || selectedLog.newValues) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Change Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLog.oldValues && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Old Values</h4>
                          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                            {formatJson(selectedLog.oldValues)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.newValues && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">New Values</h4>
                          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                            {formatJson(selectedLog.newValues)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">User Agent</h4>
                      <code className="bg-muted p-3 rounded text-sm block overflow-x-auto">
                        {selectedLog.userAgent}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedLog.action.includes('DELETE') || selectedLog.action.includes('CANCELLED') ? (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">This action involved data removal</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">This action appears normal</span>
                      </div>
                    )}

                    {!selectedLog.user && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">System-generated action</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AuditLogs;