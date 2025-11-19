import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Search, UserCheck, Ban, Eye, Download, RefreshCw, UserX, UserCog, Mail, Phone, MapPin, Calendar } from 'lucide-react';
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
  buyer?: {
    id: string;
    preferredPaymentMethod: string;
  };
  producer?: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    location: string;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  // Fetch users from backend
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

      const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setUsers(result.data.users);
          setPagination(result.data.pagination);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle user detail view
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  // Handle producer verification
  const handleVerifyProducer = async (producerId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/admin/producers/${producerId}/verify`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'VERIFIED' })
      });

      if (response.ok) {
        toast({
          title: 'Producer Verified',
          description: 'Producer has been successfully verified.',
        });
        fetchUsers(pagination.page, searchQuery);
        setUserDetailOpen(false); // Close dialog if open
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Verify producer error:', error);
      toast({
        title: 'Verification Failed',
        description: 'CORS issue - PATCH method not allowed. Check backend CORS configuration.',
        variant: 'destructive',
      });
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchUsers(1, value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  // Client-side filtering for role
  const filteredUsers = roleFilter === 'all' 
    ? users 
    : users.filter(user => user.role === roleFilter);

  // Get user status badge
  const getStatusBadge = (user: User) => {
    if (user.role === 'PRODUCER' && user.producer) {
      switch (user.producer.verificationStatus) {
        case 'VERIFIED':
          return <Badge variant="default">Verified</Badge>;
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="User Management" 
            action={
              <Button 
                variant="outline" 
                onClick={() => fetchUsers(1, searchQuery)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            }
          />

          <main className="flex-1 p-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>
                    All Users {pagination.total > 0 && `(${pagination.total})`}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="PRODUCER">Producer</SelectItem>
                        <SelectItem value="BUYER">Buyer</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
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
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>
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
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`capitalize ${getRoleBadge(user.role)}`}>
                                    {user.role.toLowerCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.producer?.location || user.region || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(user)}
                                </TableCell>
                                <TableCell>
                                  {new Date(user.registrationDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleViewUser(user)}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    
                                    {/* Producer Verification */}
                                    {user.role === 'PRODUCER' && user.producer?.verificationStatus === 'PENDING' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVerifyProducer(user.producer!.id)}
                                        title="Verify Producer"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                {users.length === 0 ? 'No users found' : 'No users match your filters'}
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
          </main>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user account.
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
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getRoleBadge(selectedUser.role)}>
                      {selectedUser.role.toLowerCase()}
                    </Badge>
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
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
                          onClick={() => handleVerifyProducer(selectedUser.producer!.id)}
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
    </SidebarProvider>
  );
};

export default UserManagement;