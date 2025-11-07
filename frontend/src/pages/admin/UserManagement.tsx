import { useState } from 'react';
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
import { Search, UserCheck, Ban, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockUsers = [
  { id: '1', name: 'Alemayehu Bekele', email: 'alemayehu@example.com', role: 'producer', verified: true, region: 'Sidama', active: true },
  { id: '2', name: 'Tigist Haile', email: 'tigist@example.com', role: 'producer', verified: true, region: 'Amhara', active: true },
  { id: '3', name: 'Dawit Tesfaye', email: 'dawit@example.com', role: 'producer', verified: true, region: 'Oromia', active: true },
  { id: '4', name: 'Sara Mohammed', email: 'sara@example.com', role: 'buyer', verified: false, region: 'Addis Ababa', active: true },
  { id: '5', name: 'Yonas Gebre', email: 'yonas@example.com', role: 'producer', verified: false, region: 'Tigray', active: false },
];

const UserManagement = () => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = mockUsers.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleVerify = (userId: string) => {
    toast({
      title: 'User Verified',
      description: 'User has been successfully verified.',
    });
  };

  const handleSuspend = (userId: string) => {
    toast({
      title: 'User Suspended',
      description: 'User account has been suspended.',
      variant: 'destructive',
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="User Management" />

          <main className="flex-1 p-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>All Users</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="producer">Producer</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.region}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.verified && (
                                <Badge variant="default">Verified</Badge>
                              )}
                              {user.active ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Suspended</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!user.verified && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerify(user.id)}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {user.active ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuspend(user.id)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserManagement;