import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  UserCheck, 
  Ban, 
  Eye, 
  Download, 
  RefreshCw, 
  UserX, 
  UserCog, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Users,
  Store,
  ShoppingCart,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for user data
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
  registrationDate: string;
  address?: string;
  region?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  lastLogin?: string;
  buyer?: {
    id: string;
    preferredPaymentMethod: string;
    totalOrders: number;
    totalSpent: number;
  };
  producer?: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    location: string;
    totalProducts: number;
    totalSales: number;
    rating?: number;
  };
  orders?: any[];
  products?: any[];
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    buyers: number;
    producers: number;
    admins: number;
    pendingVerifications: number;
    suspended: number;
  };
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    buyers: 0,
    producers: 0,
    admins: 0,
    pendingVerifications: 0,
    suspended: 0
  });
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'suspend' | 'activate' | 'delete' | 'verify' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  // Fetch users from backend
  // Update the fetchUsers function response handling
const fetchUsers = async (page = 1, search = '') => {
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
    if (roleFilter !== 'all') {
      params.append('role', roleFilter);
    }
    if (statusFilter !== 'all') {
      params.append('status', statusFilter);
    }
    if (verificationFilter !== 'all') {
      params.append('verification', verificationFilter);
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users?${params}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      
      // FIX: Handle different response structures
      if (result.status === 'success') {
        setUsers(result.data.users || result.data || []);
        setPagination(result.data.pagination || result.pagination || {
          page: 1,
          limit: 20,
          total: result.data.users?.length || 0,
          pages: 1
        });
        
        // FIX: Handle stats in different response formats
        const statsData = result.data.stats || result.stats || {
          total: result.data.users?.length || 0,
          buyers: result.data.users?.filter((u: User) => u.role === 'BUYER').length || 0,
          producers: result.data.users?.filter((u: User) => u.role === 'PRODUCER').length || 0,
          admins: result.data.users?.filter((u: User) => u.role === 'ADMIN').length || 0,
          pendingVerifications: result.data.users?.filter((u: User) => 
            u.role === 'PRODUCER' && u.producer?.verificationStatus === 'PENDING'
          ).length || 0,
          suspended: result.data.users?.filter((u: User) => u.status === 'SUSPENDED').length || 0
        };
        
        setStats(statsData);
      }
    } else {
      console.error('Failed to fetch users');
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    toast({
      title: 'Error',
      description: 'Failed to load users',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, verificationFilter]);

  // Handle user actions
  const handleUserAction = async (action: string, userId: string, reason?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      let endpoint = '';
      let method = 'PATCH';
      let body: any = {};

      switch (action) {
        case 'suspend':
          endpoint = `suspend`;
          body = { reason: reason || 'Violation of terms' };
          break;
        case 'activate':
          endpoint = `activate`;
          break;
        case 'verify':
          endpoint = `verify`;
          body = { status: 'VERIFIED' };
          break;
        case 'reject':
          endpoint = `reject`;
          body = { reason: reason || 'Failed verification criteria' };
          break;
        case 'delete':
          endpoint = ``;
          method = 'DELETE';
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/${endpoint}`, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        const actionText = action === 'suspend' ? 'suspended' : 
                          action === 'activate' ? 'activated' :
                          action === 'verify' ? 'verified' :
                          action === 'reject' ? 'rejected' : 'deleted';
        
        toast({
          title: `User ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          description: `User has been ${actionText} successfully.`,
        });
        
        fetchUsers(pagination.page, searchQuery);
        setActionDialogOpen(false);
        setUserDetailOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('User action error:', error);
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchUsers(1, value);
  };

  // Get user status badge
  const getStatusBadge = (user: User) => {
    if (user.status === 'SUSPENDED') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (user.status === 'INACTIVE') {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">Inactive</Badge>;
    }
    if (user.role === 'PRODUCER' && user.producer) {
      switch (user.producer.verificationStatus) {
        case 'VERIFIED':
          return <Badge variant="default" className="bg-green-500">Verified</Badge>;
        case 'PENDING':
          return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
        case 'REJECTED':
          return <Badge variant="destructive">Rejected</Badge>;
      }
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      PRODUCER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      BUYER: 'bg-green-500/10 text-green-600 border-green-500/20'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'PRODUCER': return <Store className="h-4 w-4" />;
      case 'BUYER': return <ShoppingCart className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="User Management"
            description="Manage all users, verify producers, and handle user accounts"
            action={
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => fetchUsers(1, searchQuery)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
  variant="outline"
  onClick={() => navigate('/admin/verification-queue')}
>
  <UserCheck className="h-4 w-4 mr-2" />
  Verification Queue ({stats.pendingVerifications})
</Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.buyers}</div>
                        <div className="text-sm text-muted-foreground">Buyers</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Store className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.producers}</div>
                        <div className="text-sm text-muted-foreground">Producers</div>
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
                        <div className="text-2xl font-bold">{stats.admins}</div>
                        <div className="text-sm text-muted-foreground">Admins</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <UserCheck className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <UserX className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.suspended}</div>
                        <div className="text-sm text-muted-foreground">Suspended</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, email, or business..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="PRODUCER">Producer</SelectItem>
                          <SelectItem value="BUYER">Buyer</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Verification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Verification</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="VERIFIED">Verified</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users ({pagination.total})
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                        {users.filter(u => u.role === 'PRODUCER' && u.producer?.verificationStatus === 'PENDING').length} Pending
                      </Badge>
                      <Badge variant="outline" className="bg-red-500/10 text-red-700">
                        {users.filter(u => u.status === 'SUSPENDED').length} Suspended
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Last Login</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.length > 0 ? (
                              users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarFallback className={getRoleBadge(user.role).split(' ')[0]}>
                                          {user.name ? user.name[0].toUpperCase() : 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{user.name}</div>
                                        {user.producer?.businessName && (
                                          <div className="text-sm text-muted-foreground">
                                            {user.producer.businessName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="text-sm">{user.email}</div>
                                      {user.phone && (
                                        <div className="text-xs text-muted-foreground">{user.phone}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`capitalize ${getRoleBadge(user.role)}`}>
                                      {getRoleIcon(user.role)}
                                      <span className="ml-1">{user.role.toLowerCase()}</span>
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {user.producer?.location || user.region || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(user)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {new Date(user.registrationDate).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-muted-foreground">
                                      {user.lastLogin 
                                        ? new Date(user.lastLogin).toLocaleDateString()
                                        : 'Never'
                                      }
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setUserDetailOpen(true);
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
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                          >
                                            <UserCog className="h-4 w-4 mr-2" />
                                            Manage User
                                          </DropdownMenuItem>
                                          
                                          {user.role === 'PRODUCER' && user.producer?.verificationStatus === 'PENDING' && (
                                            <>
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  setSelectedUser(user);
                                                  setSelectedAction('verify');
                                                  setActionDialogOpen(true);
                                                }}
                                              >
                                                <UserCheck className="h-4 w-4 mr-2" />
                                                Verify Producer
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  setSelectedUser(user);
                                                  setSelectedAction('reject');
                                                  setActionDialogOpen(true);
                                                }}
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject Verification
                                              </DropdownMenuItem>
                                            </>
                                          )}

                                          {user.status === 'ACTIVE' ? (
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setSelectedUser(user);
                                                setSelectedAction('suspend');
                                                setActionDialogOpen(true);
                                              }}
                                              className="text-red-600"
                                            >
                                              <Ban className="h-4 w-4 mr-2" />
                                              Suspend User
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setSelectedUser(user);
                                                setSelectedAction('activate');
                                                setActionDialogOpen(true);
                                              }}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Activate User
                                            </DropdownMenuItem>
                                          )}

                                          <DropdownMenuItem 
                                            onClick={() => {
                                              setSelectedUser(user);
                                              setSelectedAction('delete');
                                              setActionDialogOpen(true);
                                            }}
                                            className="text-red-600"
                                          >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Delete User
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <div>No users found</div>
                                  {searchQuery && (
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
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchUsers(pagination.page - 1, searchQuery)}
                              disabled={pagination.page === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchUsers(pagination.page + 1, searchQuery)}
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

      {/* User Detail Dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user account and activities.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getRoleBadge(selectedUser.role)}>
                      {getRoleIcon(selectedUser.role)}
                      <span className="ml-1">{selectedUser.role.toLowerCase()}</span>
                    </Badge>
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/users/${selectedUser.id}`)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Full Management
                </Button>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{selectedUser.email}</div>
                  </div>
                </div>
                
                {selectedUser.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{selectedUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Registered</div>
                    <div className="font-medium">
                      {new Date(selectedUser.registrationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {(selectedUser.region || selectedUser.producer?.location) && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Location</div>
                      <div className="font-medium">
                        {selectedUser.producer?.location || selectedUser.region}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedUser.buyer && (
                  <>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedUser.buyer.totalOrders || 0}</div>
                      <div className="text-sm text-muted-foreground">Orders</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedUser.buyer.totalSpent || 0} ETB</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                  </>
                )}
                {selectedUser.producer && (
                  <>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedUser.producer.totalProducts || 0}</div>
                      <div className="text-sm text-muted-foreground">Products</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedUser.producer.totalSales || 0} ETB</div>
                      <div className="text-sm text-muted-foreground">Total Sales</div>
                    </div>
                    {selectedUser.producer.rating && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{selectedUser.producer.rating}/5</div>
                        <div className="text-sm text-muted-foreground">Rating</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Producer Specific Information */}
              {selectedUser.role === 'PRODUCER' && selectedUser.producer && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Business Name</div>
                      <div className="font-medium">{selectedUser.producer.businessName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Verification Status</div>
                      <div>{getStatusBadge(selectedUser)}</div>
                    </div>
                  </div>

                  {/* Verification Action */}
                  {selectedUser.producer.verificationStatus === 'PENDING' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-yellow-800">Pending Verification</div>
                          <div className="text-sm text-yellow-600">This producer account needs verification</div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedAction('verify');
                            setActionDialogOpen(true);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Verify Producer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buyer Specific Information */}
              {selectedUser.role === 'BUYER' && selectedUser.buyer && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Buyer Preferences</h4>
                  <div>
                    <div className="text-sm text-muted-foreground">Preferred Payment Method</div>
                    <div className="font-medium">{selectedUser.buyer.preferredPaymentMethod}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction === 'suspend' && <Ban className="h-5 w-5 text-red-500" />}
              {selectedAction === 'activate' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedAction === 'verify' && <UserCheck className="h-5 w-5 text-green-500" />}
              {selectedAction === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
              {selectedAction === 'delete' && <UserX className="h-5 w-5 text-red-500" />}
              {selectedAction === 'suspend' && 'Suspend User'}
              {selectedAction === 'activate' && 'Activate User'}
              {selectedAction === 'verify' && 'Verify Producer'}
              {selectedAction === 'reject' && 'Reject Verification'}
              {selectedAction === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'suspend' && 'Are you sure you want to suspend this user? They will not be able to access their account.'}
              {selectedAction === 'activate' && 'Are you sure you want to activate this user?'}
              {selectedAction === 'verify' && 'Are you sure you want to verify this producer? This will grant them full access to seller features.'}
              {selectedAction === 'reject' && 'Are you sure you want to reject this producer verification? They will need to reapply.'}
              {selectedAction === 'delete' && 'Are you sure you want to delete this user? This action cannot be undone and will remove all their data.'}
            </DialogDescription>
          </DialogHeader>

          {(selectedAction === 'suspend' || selectedAction === 'reject') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedAction === 'delete' || selectedAction === 'suspend' || selectedAction === 'reject' 
                  ? 'destructive' 
                  : 'default'
              }
              onClick={() => {
                if (selectedUser && selectedAction) {
                  handleUserAction(selectedAction, selectedUser.id, actionReason);
                }
              }}
            >
              {selectedAction === 'suspend' && 'Suspend User'}
              {selectedAction === 'activate' && 'Activate User'}
              {selectedAction === 'verify' && 'Verify Producer'}
              {selectedAction === 'reject' && 'Reject Verification'}
              {selectedAction === 'delete' && 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default UserManagement;