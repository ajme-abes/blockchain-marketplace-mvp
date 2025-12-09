// src/pages/admin/VerificationQueue.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  Search,
  UserCheck,
  UserX,
  Eye,
  MapPin,
  Calendar,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  ArrowLeft,
  Store,
  AlertTriangle,
  RefreshCw,
  Images,
  Shield
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Producer {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    registrationDate: string;
    region?: string;
    avatarUrl?: string;
    fileSize?: number;
  };
  businessName: string;
  businessDescription?: string;
  location: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationSubmittedAt: string;
  businessLicense?: string;
  taxId?: string;
  documents?: Array<{
    id: string;
    type: string;
    url: string;
    filename: string;
    uploadedAt: string;
    fileSize?: number;
  }>;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  products?: Array<{ // 🆕 ADD PRODUCTS COUNT
    id: string;
    name: string;
    status: string;
  }>;
}

const VerificationQueue = () => {
  const navigate = useNavigate();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'verify' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [currentDocument, setCurrentDocument] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchVerificationQueue();
  }, []);

  const fetchVerificationQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      // Fetch ALL producers, not just pending
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/producers/all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setProducers(result.data.producers || result.data || []);
        }
      } else {
        throw new Error('Failed to fetch producers');
      }
    } catch (error) {
      console.error('Error fetching producers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load producers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handles verification or rejection of a producer
  const handleVerificationAction = async (
    action: 'verify' | 'reject',
    producerId: string,
    reason?: string
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/producers/${producerId}/verify`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            status: action === 'verify' ? 'VERIFIED' : 'REJECTED',
            reason: action === 'reject' ? reason : undefined
          })
        }
      );

      if (response.ok) {
        const actionText = action === 'verify' ? 'verified' : 'rejected';
        toast({
          title: `Producer ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          description: `Producer has been ${actionText} successfully.`,
        });
        fetchVerificationQueue();
        setActionDialogOpen(false);
        setDetailDialogOpen(false);
        setRejectionReason('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('Verification action error:', error);
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // In a real app, you would debounce this and make an API call
  };

  // Filter by active tab and search query
  const filteredProducers = producers.filter(producer => {
    // Filter by verification status (tab)
    if (producer.verificationStatus !== activeTab) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        producer.businessName.toLowerCase().includes(query) ||
        producer.user.name.toLowerCase().includes(query) ||
        producer.user.email.toLowerCase().includes(query) ||
        producer.location.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get counts for each tab
  const pendingCount = producers.filter(p => p.verificationStatus === 'PENDING').length;
  const verifiedCount = producers.filter(p => p.verificationStatus === 'VERIFIED').length;
  const rejectedCount = producers.filter(p => p.verificationStatus === 'REJECTED').length;

  const getDaysInQueue = (submittedAt: string) => {
    const submittedDate = new Date(submittedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submittedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityBadge = (days: number) => {
    if (days > 7) {
      return <Badge variant="destructive">High Priority</Badge>;
    } else if (days > 3) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Medium Priority</Badge>;
    } else {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Low Priority</Badge>;
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Verification Queue" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading verification queue...</p>
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
            title="Verification Queue"
            description="Review and verify producer accounts"
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchVerificationQueue}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{verifiedCount}</div>
                        <div className="text-sm text-muted-foreground">Verified</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{rejectedCount}</div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Store className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{producers.length}</div>
                        <div className="text-sm text-muted-foreground">Total Producers</div>
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
                        placeholder="Search by business name, owner name, email, or location..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Queue with Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Producer Verification Management
                  </CardTitle>
                  <CardDescription>
                    Review and manage producer verification requests across all statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="PENDING" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending ({pendingCount})
                      </TabsTrigger>
                      <TabsTrigger value="VERIFIED" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Verified ({verifiedCount})
                      </TabsTrigger>
                      <TabsTrigger value="REJECTED" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected ({rejectedCount})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-0">
                      {filteredProducers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Business</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>
                                  {activeTab === 'PENDING' && 'Submitted'}
                                  {activeTab === 'VERIFIED' && 'Verified Date'}
                                  {activeTab === 'REJECTED' && 'Rejected Date'}
                                </TableHead>
                                {activeTab === 'PENDING' && <TableHead>Days in Queue</TableHead>}
                                {activeTab === 'VERIFIED' && <TableHead>Verified By</TableHead>}
                                {activeTab === 'REJECTED' && <TableHead>Rejection Reason</TableHead>}
                                <TableHead>Documents</TableHead>
                                {activeTab === 'PENDING' && <TableHead>Priority</TableHead>}
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProducers.map((producer) => {
                                const daysInQueue = getDaysInQueue(producer.verificationSubmittedAt);
                                return (
                                  <TableRow key={producer.id} className="hover:bg-muted/50">
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar>
                                          <AvatarImage
                                            src={producer.user.avatarUrl}
                                            alt={producer.businessName}
                                            className="object-cover"
                                          />
                                          <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {producer.businessName[0].toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{producer.businessName}</div>
                                          {producer.businessDescription && (
                                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                              {producer.businessDescription}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{producer.user.name}</div>
                                        <div className="text-sm text-muted-foreground">{producer.user.email}</div>
                                        {producer.user.phone && (
                                          <div className="text-sm text-muted-foreground">{producer.user.phone}</div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span>{producer.location}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {activeTab === 'PENDING' && new Date(producer.verificationSubmittedAt).toLocaleDateString()}
                                      {activeTab === 'VERIFIED' && producer.verifiedAt && new Date(producer.verifiedAt).toLocaleDateString()}
                                      {activeTab === 'REJECTED' && producer.verificationSubmittedAt && new Date(producer.verificationSubmittedAt).toLocaleDateString()}
                                    </TableCell>
                                    {activeTab === 'PENDING' && (
                                      <TableCell>
                                        <div className={`font-medium ${daysInQueue > 7 ? 'text-red-600' : daysInQueue > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                          {daysInQueue} days
                                        </div>
                                      </TableCell>
                                    )}
                                    {activeTab === 'VERIFIED' && (
                                      <TableCell>
                                        <div className="flex items-center gap-1">
                                          <Shield className="h-3 w-3 text-green-600" />
                                          <span className="text-sm">{producer.verifiedBy || 'Admin'}</span>
                                        </div>
                                      </TableCell>
                                    )}
                                    {activeTab === 'REJECTED' && (
                                      <TableCell>
                                        <div className="text-sm text-red-600 truncate max-w-[200px]">
                                          {producer.rejectionReason || 'No reason provided'}
                                        </div>
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1">
                                          <FileText className="h-3 w-3 text-muted-foreground" />
                                          <span>{producer.documents?.length || 0} docs</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Store className="h-3 w-3" />
                                          <span>{producer.products?.length || 0} products</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    {activeTab === 'PENDING' && (
                                      <TableCell>
                                        {getPriorityBadge(daysInQueue)}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedProducer(producer);
                                            setDetailDialogOpen(true);
                                          }}
                                          title="View Details"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>

                                        {/* Show verify/reject buttons for PENDING and REJECTED */}
                                        {(activeTab === 'PENDING' || activeTab === 'REJECTED') && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedProducer(producer);
                                                setSelectedAction('verify');
                                                setActionDialogOpen(true);
                                              }}
                                              title="Verify Producer"
                                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            {activeTab === 'PENDING' && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedProducer(producer);
                                                  setSelectedAction('reject');
                                                  setActionDialogOpen(true);
                                                }}
                                                title="Reject Verification"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <XCircle className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </>
                                        )}

                                        {/* Show status badge for VERIFIED */}
                                        {activeTab === 'VERIFIED' && (
                                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          {activeTab === 'PENDING' && <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
                          {activeTab === 'VERIFIED' && <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
                          {activeTab === 'REJECTED' && <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
                          <h3 className="text-lg font-semibold mb-2">
                            {activeTab === 'PENDING' && 'No Pending Verifications'}
                            {activeTab === 'VERIFIED' && 'No Verified Producers'}
                            {activeTab === 'REJECTED' && 'No Rejected Producers'}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery ? 'No producers match your search' :
                              activeTab === 'PENDING' ? 'All producer verifications have been processed' :
                                activeTab === 'VERIFIED' ? 'No producers have been verified yet' :
                                  'No producers have been rejected'}
                          </p>
                          {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery('')}>
                              Clear Search
                            </Button>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Producer Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Producer Verification Details</DialogTitle>
            <DialogDescription>
              Review business information and documents for verification
            </DialogDescription>
          </DialogHeader>

          {selectedProducer && (
            <div className="space-y-6">
              {/* Business Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedProducer.user.avatarUrl}
                    alt={selectedProducer.businessName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                    {selectedProducer.businessName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedProducer.businessName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Pending Verification
                    </Badge>
                    <Badge variant="outline">
                      {getDaysInQueue(selectedProducer.verificationSubmittedAt)} days in queue
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Rejection History Warning */}
              {selectedProducer.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 dark:text-red-400">Previously Rejected</div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        <span className="font-medium">Reason:</span> {selectedProducer.rejectionReason}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                        This producer has resubmitted their verification request. Please review carefully.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedProducer.user.avatarUrl}
                          alt={selectedProducer.user.name}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {selectedProducer.user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedProducer.user.name}</div>
                        <div className="text-sm text-muted-foreground">Business Owner</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedProducer.user.email}</span>
                      </div>
                      {selectedProducer.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedProducer.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Registered {new Date(selectedProducer.user.registrationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Business Location</div>
                      <div className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedProducer.location}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Verification Submitted</div>
                      <div className="font-medium">
                        {new Date(selectedProducer.verificationSubmittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedProducer.businessLicense && (
                      <div>
                        <div className="text-sm text-muted-foreground">Business License</div>
                        <div className="font-medium flex items-center gap-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          {selectedProducer.businessLicense}
                        </div>
                      </div>
                    )}
                    {selectedProducer.taxId && (
                      <div>
                        <div className="text-sm text-muted-foreground">Tax ID</div>
                        <div className="font-medium flex items-center gap-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          {selectedProducer.taxId}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedProducer.businessDescription && (
                    <div>
                      <div className="text-sm text-muted-foreground">Business Description</div>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                        {selectedProducer.businessDescription}
                      </div>
                    </div>
                  )}

                  {/* Product Count */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedProducer.products?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Products Listed</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedProducer.documents?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Documents Submitted</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Documents */}
                  {selectedProducer.documents && selectedProducer.documents.length > 0 ? (
                    <div>
                      <div className="text-sm text-muted-foreground mb-3">Submitted Documents</div>
                      <div className="space-y-3">
                        {selectedProducer.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Document Icon based on type */}
                              {doc.type.includes('image') ? (
                                <Images className="h-8 w-8 text-blue-500" />
                              ) : doc.type.includes('pdf') ? (
                                <FileText className="h-8 w-8 text-red-500" />
                              ) : (
                                <FileText className="h-8 w-8 text-gray-500" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{doc.filename}</div>
                                <div className="text-sm text-muted-foreground">
                                  {doc.type.split('/')[1]?.toUpperCase() || 'FILE'} •
                                  {doc.fileSize ? ` ${(doc.fileSize / 1024).toFixed(1)} KB` : ' Size unknown'} •
                                  {' '}{new Date(doc.uploadedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {/* 🆕 PREVIEW BUTTON */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentDocument(doc);
                                  setPreviewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              {/* 🆕 DOWNLOAD BUTTON */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.url;
                                  link.download = doc.filename;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-lg bg-muted/20">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <div className="text-muted-foreground">No documents submitted</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        This producer hasn't uploaded any verification documents yet.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAction('reject');
                    setActionDialogOpen(true);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Verification
                </Button>
                <Button
                  onClick={() => {
                    setSelectedAction('verify');
                    setActionDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Producer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction === 'verify' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedAction === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
              {selectedAction === 'verify' && 'Verify Producer'}
              {selectedAction === 'reject' && 'Reject Verification'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'verify' && 'Are you sure you want to verify this producer? This will grant them full access to seller features.'}
              {selectedAction === 'reject' && 'Are you sure you want to reject this producer verification? They will need to reapply.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAction === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be shared with the producer.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={selectedAction === 'reject' ? 'destructive' : 'default'}
              onClick={() => {
                if (selectedProducer && selectedAction) {
                  handleVerificationAction(selectedAction, selectedProducer.id, rejectionReason);
                }
              }}
              disabled={selectedAction === 'reject' && !rejectionReason.trim()}
            >
              {selectedAction === 'verify' && 'Verify Producer'}
              {selectedAction === 'reject' && 'Reject Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal - Separate from Action Dialog */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{currentDocument?.filename}</DialogTitle>
            <DialogDescription>
              Document preview - {currentDocument?.type}
            </DialogDescription>
          </DialogHeader>

          {currentDocument && (
            <div className="flex justify-center">
              {currentDocument.type.includes('image') ? (
                // Image Preview
                <img
                  src={currentDocument.url}
                  alt={currentDocument.filename}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : currentDocument.type.includes('pdf') ? (
                // PDF Preview (embedded)
                <div className="w-full h-[70vh] border rounded-lg">
                  <iframe
                    src={currentDocument.url}
                    className="w-full h-full"
                    title={currentDocument.filename}
                  />
                </div>
              ) : (
                // Other file types - download only
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">Document Preview Not Available</div>
                  <div className="text-muted-foreground mb-4">
                    This file type cannot be previewed in the browser.
                  </div>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = currentDocument.url;
                      link.download = currentDocument.filename;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (currentDocument) {
                  const link = document.createElement('a');
                  link.href = currentDocument.url;
                  link.download = currentDocument.filename;
                  link.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setPreviewModalOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default VerificationQueue;