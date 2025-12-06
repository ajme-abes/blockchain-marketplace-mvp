// src/pages/admin/UserDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Ban,
  Shield,
  ShoppingCart,
  Store,
  Package,
  DollarSign,
  Star,
  FileText,
  AlertTriangle,
  Edit,
  MoreVertical,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
  registrationDate: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  address?: string;
  region?: string;
  avatarUrl?: string;
  buyer?: {
    id: string;
    preferredPaymentMethod: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
  producer?: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    location: string;
    totalProducts: number;
    totalSales: number;
    rating: number;
    reviewCount: number;
    businessDescription?: string;
  };
  orders?: any[];
  products?: any[];
  reviews?: any[];
}

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'suspend' | 'activate' | 'verify' | 'reject' | 'delete' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);
  
  useEffect(() => {
    console.log('📊 CURRENT USER STATE:', user);
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 FULL API RESPONSE:', result); // Debug log
        
        if (result.status === 'success') {
          // Try different response structures
          const userData = result.data.user || result.data || result;
          console.log('👤 EXTRACTED USER DATA:', userData);
          setUser(userData);
        }
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, reason?: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('authToken');
      let endpoint = '';
      let method = 'PATCH';
      let body: any = {};

      switch (action) {
        case 'suspend':
          endpoint = 'suspend';
          body = { reason: reason || 'Violation of terms' };
          break;
        case 'activate':
          endpoint = 'activate';
          break;
        case 'verify':
          endpoint = 'verify';
          body = { status: 'VERIFIED' };
          break;
        case 'reject':
          endpoint = 'reject';
          body = { reason: reason || 'Failed verification criteria' };
          break;
        case 'delete':
          endpoint = '';
          method = 'DELETE';
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${user.id}/${endpoint}`, {
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

        if (action === 'delete') {
          navigate('/admin/users');
        } else {
          fetchUserDetails();
        }
        setActionDialogOpen(false);
        setActionReason('');
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

  const getStatusBadge = (user: User | null) => {
    if (!user) return <Badge variant="outline">Loading...</Badge>;
    
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

  const getRoleBadge = (role: string) => {
    if (!role) return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    
    const colors = {
      ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      PRODUCER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      BUYER: 'bg-green-500/10 text-green-600 border-green-500/20'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'PRODUCER': return <Store className="h-4 w-4" />;
      case 'BUYER': return <ShoppingCart className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="User Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading user details...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!user) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="User Not Found" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
                <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
                <Button onClick={() => navigate('/admin/users')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
<PageHeader
  title="User Management"
  description={`Managing ${user.name}'s account`}
  action={
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => navigate('/admin/users')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>
      
      {/* 🆕 ADD VERIFICATION QUEUE BUTTON FOR PRODUCERS */}
      {user.role === 'PRODUCER' && user.producer && (
        <Button
          variant="outline"
          onClick={() => navigate('/admin/verification-queue')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Verification Queue
        </Button>
      )}
      
      {/* Action Buttons based on user status */}
      {user.status === 'ACTIVE' ? (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedAction('suspend');
            setActionDialogOpen(true);
          }}
        >
          <Ban className="h-4 w-4 mr-2" />
          Suspend User
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedAction('activate');
            setActionDialogOpen(true);
          }}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Activate User
        </Button>
      )}

      {/* Producer Verification */}
      {user.role === 'PRODUCER' && user.producer?.verificationStatus === 'PENDING' && (
        <Button
          onClick={() => {
            setSelectedAction('verify');
            setActionDialogOpen(true);
          }}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Verify Producer
        </Button>
      )}
    </div>
  }
/>

          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* User Profile Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xl">
  {user?.name ? user.name[0].toUpperCase() : 'U'}
</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getRoleBadge(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user?.role?.toUpperCase() ?? "UNKNOWN"}</span>
                        </Badge>
                        {getStatusBadge(user)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="text-muted-foreground">Registered</div>
                          <div>{new Date(user.registrationDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="text-muted-foreground">Last Login</div>
                            <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}

                      {user.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="text-muted-foreground">Phone</div>
                            <div>{user.phone}</div>
                          </div>
                        </div>
                      )}

                      {(user.region || user.producer?.location) && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="text-muted-foreground">Location</div>
                            <div>{user.producer?.location || user.region}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {user.buyer && (
                        <>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.buyer.totalOrders}</div>
                                  <div className="text-sm text-muted-foreground">Total Orders</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.buyer.totalSpent} ETB</div>
                                  <div className="text-sm text-muted-foreground">Total Spent</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-8 w-8 text-purple-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.buyer.averageOrderValue} ETB</div>
                                  <div className="text-sm text-muted-foreground">Avg. Order</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}

                      {user.producer && (
                        <>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Package className="h-8 w-8 text-blue-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.producer.totalProducts}</div>
                                  <div className="text-sm text-muted-foreground">Products</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.producer.totalSales} ETB</div>
                                  <div className="text-sm text-muted-foreground">Total Sales</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Star className="h-8 w-8 text-yellow-600" />
                                <div>
                                  <div className="text-2xl font-bold">{user.producer.rating}/5</div>
                                  <div className="text-sm text-muted-foreground">Rating</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Business Information for Producers */}
                    {user.role === 'PRODUCER' && user.producer && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Business Name</div>
                              <div className="font-medium">{user.producer.businessName}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Location</div>
                              <div className="font-medium">{user.producer.location}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Verification Status</div>
                              <div>{getStatusBadge(user)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Total Reviews</div>
                              <div className="font-medium">{user.producer.reviewCount}</div>
                            </div>
                          </div>
                          
                          {user.producer.businessDescription && (
                            <div>
                              <div className="text-sm text-muted-foreground">Business Description</div>
                              <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                                {user.producer.businessDescription}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {user.orders && user.orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">Order #{order.id.slice(-8)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()} • {order.totalAmount} ETB
                                </div>
                              </div>
                              <Badge variant={order.status === 'DELIVERED' ? 'default' : 'outline'}>
                                {order.status}
                              </Badge>
                            </div>
                          ))}
                          
                          {(!user.orders || user.orders.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                              No recent activity
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity Log</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          Activity log feature coming soon
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Orders Tab */}
                  <TabsContent value="orders">
                    <Card>
                      <CardHeader>
                        <CardTitle>Order History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.orders && user.orders.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {user.orders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-mono text-sm">#{order.id.slice(-8)}</TableCell>
                                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>{order.totalAmount} ETB</TableCell>
                                  <TableCell>
                                    <Badge variant={order.status === 'DELIVERED' ? 'default' : 'outline'}>
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{order.items?.length || 0} items</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No orders found
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>
                          Manage user account settings and permissions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">Account Status</div>
                              <div className="text-sm text-muted-foreground">
                                {user.status === 'ACTIVE' ? 'User can access the platform' : 'User account is restricted'}
                              </div>
                            </div>
                            <Button
                              variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                              onClick={() => {
                                setSelectedAction(user.status === 'ACTIVE' ? 'suspend' : 'activate');
                                setActionDialogOpen(true);
                              }}
                            >
                              {user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            </Button>
                          </div>

                          {user.role === 'PRODUCER' && user.producer && (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">Producer Verification</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.producer.verificationStatus === 'VERIFIED' 
                                    ? 'Producer is verified and can sell products'
                                    : user.producer.verificationStatus === 'PENDING'
                                    ? 'Producer verification is pending review'
                                    : 'Producer verification was rejected'
                                  }
                                </div>
                              </div>
                              {user.producer.verificationStatus === 'PENDING' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAction('reject');
                                      setActionDialogOpen(true);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedAction('verify');
                                      setActionDialogOpen(true);
                                    }}
                                  >
                                    Verify
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
{user.role === 'PRODUCER' && (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <div className="font-medium">Verification Management</div>
      <div className="text-sm text-muted-foreground">
        Manage this producer's verification status and view all pending verifications
      </div>
    </div>
    <Button
  variant="outline"
  onClick={() => navigate('/admin/verification-queue')}
>
  <UserCheck className="h-4 w-4 mr-2" />
  View Verification Queue
</Button>
  </div>
)}

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">Delete Account</div>
                              <div className="text-sm text-muted-foreground">
                                Permanently delete this user account and all associated data
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setSelectedAction('delete');
                                setActionDialogOpen(true);
                              }}
                            >
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction === 'suspend' && <Ban className="h-5 w-5 text-red-500" />}
              {selectedAction === 'activate' && <UserCheck className="h-5 w-5 text-green-500" />}
              {selectedAction === 'verify' && <UserCheck className="h-5 w-5 text-green-500" />}
              {selectedAction === 'reject' && <UserX className="h-5 w-5 text-red-500" />}
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
                if (selectedAction) {
                  handleUserAction(selectedAction, actionReason);
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

export default UserDetail;