// frontend/src/pages/admin/PayoutManagement.tsx
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
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Download,
    Filter,
    Search,
    RefreshCw,
    Store,
    TrendingUp,
    Wallet,
    Eye,
    Phone,
    Mail,
    MapPin,
    Building2,
    CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import payoutService, { ProducerPayout } from '../../services/payoutService';

const PayoutManagement = () => {
    const [payouts, setPayouts] = useState<ProducerPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'due' | 'pending'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayout, setSelectedPayout] = useState<ProducerPayout | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showFailModal, setShowFailModal] = useState(false);
    const [payoutReference, setPayoutReference] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER');
    const [failureReason, setFailureReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProducerDetails, setSelectedProducerDetails] = useState<ProducerPayout | null>(null);
    const [producerBankAccounts, setProducerBankAccounts] = useState<any[]>([]);
    const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadPayouts();
    }, [filter]);

    const loadPayouts = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading payouts with filter:', filter);
            let data;

            if (filter === 'due') {
                console.log('📅 Fetching due payouts...');
                const result = await payoutService.getDuePayouts();
                console.log('✅ Due payouts result:', result);
                data = result.payouts;
            } else {
                console.log('📋 Fetching all pending payouts...');
                data = await payoutService.getPendingPayouts();
                console.log('✅ Pending payouts result:', data);
            }

            console.log('📊 Setting payouts:', data);
            setPayouts(data || []);

            if (!data || data.length === 0) {
                console.log('⚠️ No payouts returned from API');
            }
        } catch (error: any) {
            console.error('❌ Error loading payouts:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                stack: error.stack
            });
            toast({
                title: 'Error',
                description: error.message || 'Failed to load payouts',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (payout: ProducerPayout) => {
        try {
            setProcessing(true);
            await payoutService.markPayoutProcessing(payout.id);
            toast({
                title: 'Payout Processing',
                description: 'Payout marked as processing',
            });
            await loadPayouts();
        } catch (error) {
            console.error('Error processing payout:', error);
            toast({
                title: 'Error',
                description: 'Failed to mark payout as processing',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCompletePayout = async () => {
        if (!selectedPayout || !payoutReference.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a payout reference',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(true);
            await payoutService.markPayoutComplete(
                selectedPayout.id,
                payoutReference,
                payoutMethod
            );
            setShowCompleteModal(false);
            setPayoutReference('');
            setSelectedPayout(null);
            await loadPayouts();
            toast({
                title: 'Payout Completed',
                description: 'Payout has been marked as completed successfully',
            });
        } catch (error) {
            console.error('Error completing payout:', error);
            toast({
                title: 'Error',
                description: 'Failed to complete payout',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleFailPayout = async () => {
        if (!selectedPayout || !failureReason.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a failure reason',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(true);
            await payoutService.markPayoutFailed(selectedPayout.id, failureReason);
            setShowFailModal(false);
            setFailureReason('');
            setSelectedPayout(null);
            await loadPayouts();
            toast({
                title: 'Payout Failed',
                description: 'Payout has been marked as failed',
            });
        } catch (error) {
            console.error('Error failing payout:', error);
            toast({
                title: 'Error',
                description: 'Failed to mark payout as failed',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const loadProducerBankAccounts = async (producerId: string) => {
        try {
            setLoadingBankAccounts(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/admin/producer/${producerId}/bank-accounts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load bank accounts');

            const data = await response.json();
            setProducerBankAccounts(data.accounts || []);
        } catch (error: any) {
            console.error('Error loading bank accounts:', error);
            setProducerBankAccounts([]);
        } finally {
            setLoadingBankAccounts(false);
        }
    };

    const filteredPayouts = payouts.filter(payout =>
        payout.producer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.producer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.producer.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = filteredPayouts.reduce((sum, p) => sum + p.netAmount, 0);
    const totalCommission = filteredPayouts.reduce((sum, p) => sum + p.commission, 0);
    const dueCount = payouts.filter(p => new Date(p.scheduledFor) <= new Date()).length;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader
                        title="Producer Payouts"
                        description="Manage and process producer payments"
                        action={
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => loadPayouts()}
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
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <DollarSign className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">{filteredPayouts.length}</div>
                                                <div className="text-sm text-muted-foreground">Total Payouts</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Wallet className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {payoutService.formatCurrency(totalAmount)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Total Amount</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <TrendingUp className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {payoutService.formatCurrency(totalCommission)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Commission</div>
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
                                                <div className="text-2xl font-bold">{dueCount}</div>
                                                <div className="text-sm text-muted-foreground">Due Today</div>
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
                                                placeholder="Search by producer name or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                                <SelectTrigger className="w-[140px]">
                                                    <Filter className="h-4 w-4 mr-2" />
                                                    <SelectValue placeholder="Filter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="due">Due Now</SelectItem>
                                                    <SelectItem value="pending">All Pending</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payouts Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Payouts ({filteredPayouts.length})
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-700">
                                                {dueCount} Due
                                            </Badge>
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                                                {filteredPayouts.filter(p => p.status === 'SCHEDULED').length} Scheduled
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <RefreshCw className="h-8 w-8 animate-spin" />
                                            <span className="ml-2">Loading payouts...</span>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Producer</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Commission</TableHead>
                                                        <TableHead>Net Amount</TableHead>
                                                        <TableHead>Orders</TableHead>
                                                        <TableHead>Scheduled</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPayouts.length > 0 ? (
                                                        filteredPayouts.map((payout) => (
                                                            <TableRow key={payout.id} className="hover:bg-muted/50">
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar>
                                                                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                                <Store className="h-4 w-4" />
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-medium">{payout.producer.businessName}</div>
                                                                            <div className="text-sm text-muted-foreground">
                                                                                {payout.producer.user.email}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        {payoutService.formatCurrency(payout.amount)}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {payoutService.formatCurrency(payout.commission)}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm font-medium text-green-600">
                                                                        {payoutService.formatCurrency(payout.netAmount)}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">{payout.orders.length} orders</div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        {payoutService.formatDate(payout.scheduledFor)}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={payoutService.getStatusColor(payout.status)}
                                                                    >
                                                                        {payout.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        {/* View Details Button - Always visible */}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={async () => {
                                                                                setSelectedProducerDetails(payout);
                                                                                setShowDetailsModal(true);
                                                                                // Load bank accounts
                                                                                await loadProducerBankAccounts(payout.producer.id);
                                                                            }}
                                                                            title="View Producer Details"
                                                                        >
                                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                                        </Button>

                                                                        {payout.status === 'SCHEDULED' && (
                                                                            <>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleProcessPayout(payout)}
                                                                                    disabled={processing}
                                                                                    title="Mark as Processing"
                                                                                >
                                                                                    <Clock className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedPayout(payout);
                                                                                        setShowCompleteModal(true);
                                                                                    }}
                                                                                    title="Complete Payout"
                                                                                >
                                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedPayout(payout);
                                                                                        setShowFailModal(true);
                                                                                    }}
                                                                                    title="Mark as Failed"
                                                                                >
                                                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        {payout.status === 'PROCESSING' && (
                                                                            <>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedPayout(payout);
                                                                                        setShowCompleteModal(true);
                                                                                    }}
                                                                                    title="Complete Payout"
                                                                                >
                                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedPayout(payout);
                                                                                        setShowFailModal(true);
                                                                                    }}
                                                                                    title="Mark as Failed"
                                                                                >
                                                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        {payout.status === 'COMPLETED' && (
                                                                            <span className="text-sm text-muted-foreground">Completed</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="text-center py-8">
                                                                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                                                                <h3 className="mt-2 text-sm font-medium">No payouts found</h3>
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {filter === 'due'
                                                                        ? 'No payouts are due for processing right now.'
                                                                        : 'No pending payouts at the moment.'}
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>

            {/* Complete Payout Dialog */}
            <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Payout</DialogTitle>
                        <DialogDescription>
                            Mark this payout as completed and enter payment details
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayout && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Producer:</span>
                                    <span className="font-medium">{selectedPayout.producer.businessName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Amount:</span>
                                    <span className="font-medium text-green-600">
                                        {payoutService.formatCurrency(selectedPayout.netAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payout Method</label>
                                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CHECK">Check</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Reference *</label>
                                <Input
                                    value={payoutReference}
                                    onChange={(e) => setPayoutReference(e.target.value)}
                                    placeholder="e.g., BANK_TRANSFER_123456"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCompleteModal(false);
                                setPayoutReference('');
                                setSelectedPayout(null);
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCompletePayout}
                            disabled={processing || !payoutReference.trim()}
                        >
                            {processing ? 'Processing...' : 'Complete Payout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fail Payout Dialog */}
            <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Payout as Failed</DialogTitle>
                        <DialogDescription>
                            Provide a reason for why this payout failed
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayout && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Producer:</span>
                                    <span className="font-medium">{selectedPayout.producer.businessName}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Failure Reason *</label>
                                <Textarea
                                    value={failureReason}
                                    onChange={(e) => setFailureReason(e.target.value)}
                                    placeholder="Explain why the payout failed..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowFailModal(false);
                                setFailureReason('');
                                setSelectedPayout(null);
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleFailPayout}
                            disabled={processing || !failureReason.trim()}
                        >
                            {processing ? 'Processing...' : 'Mark as Failed'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Producer Details Dialog */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Producer Details
                        </DialogTitle>
                        <DialogDescription>
                            Contact information and bank account details for payout processing
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProducerDetails && (
                        <div className="space-y-6">
                            {/* Business Information */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Business Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Business Name</div>
                                        <div className="font-medium">{selectedProducerDetails.producer.businessName}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Owner Name</div>
                                        <div className="font-medium">{selectedProducerDetails.producer.user.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Location</div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {selectedProducerDetails.producer.location || 'Not specified'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Verification Status</div>
                                        <Badge variant={selectedProducerDetails.producer.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                                            {selectedProducerDetails.producer.verificationStatus || 'PENDING'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Contact Information
                                </h3>
                                <div className="space-y-3 p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="text-xs text-muted-foreground">Email</div>
                                            <div className="font-medium">{selectedProducerDetails.producer.user.email}</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.location.href = `mailto:${selectedProducerDetails.producer.user.email}`}
                                        >
                                            Send Email
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="text-xs text-muted-foreground">Phone</div>
                                            <div className="font-medium">
                                                {selectedProducerDetails.producer.user.phone || 'Not provided'}
                                            </div>
                                        </div>
                                        {selectedProducerDetails.producer.user.phone && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.location.href = `tel:${selectedProducerDetails.producer.user.phone}`}
                                            >
                                                Call
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Account Information */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Bank Account Information
                                </h3>
                                {loadingBankAccounts ? (
                                    <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-sm">Loading bank accounts...</span>
                                    </div>
                                ) : producerBankAccounts.length > 0 ? (
                                    <div className="space-y-2">
                                        {producerBankAccounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className={`p-3 rounded-lg border ${account.isPrimary
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-muted'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="font-medium text-sm">{account.bankName}</div>
                                                    <div className="flex gap-1">
                                                        {account.isPrimary && (
                                                            <Badge className="bg-blue-500 text-xs">Primary</Badge>
                                                        )}
                                                        {account.isVerified ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    <div>
                                                        <span className="font-medium">Account Name:</span>{' '}
                                                        {account.accountName}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Account Number:</span>{' '}
                                                        {account.accountNumber}
                                                    </div>
                                                    {account.branchName && (
                                                        <div>
                                                            <span className="font-medium">Branch:</span>{' '}
                                                            {account.branchName}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium">Type:</span> {account.accountType}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <div className="text-sm text-amber-800">
                                                <p className="font-medium mb-1">No Bank Accounts Added</p>
                                                <p className="text-xs">
                                                    Producer hasn't added bank account details yet.
                                                    Please contact them directly for payment information.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payout Summary */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Payout Summary
                                </h3>
                                <div className="space-y-2 p-4 bg-muted rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Gross Amount:</span>
                                        <span className="font-medium">{payoutService.formatCurrency(selectedProducerDetails.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Commission (10%):</span>
                                        <span className="font-medium text-red-600">
                                            -{payoutService.formatCurrency(selectedProducerDetails.commission)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-semibold">Net Amount to Pay:</span>
                                        <span className="font-bold text-green-600 text-lg">
                                            {payoutService.formatCurrency(selectedProducerDetails.netAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Scheduled For:</span>
                                        <span>{payoutService.formatDate(selectedProducerDetails.scheduledFor)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Number of Orders:</span>
                                        <span>{selectedProducerDetails.orders.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Orders List */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm">Included Orders</h3>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {selectedProducerDetails.orders.map((order) => (
                                        <div key={order.orderId} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                            <span className="font-mono text-xs">{order.orderId.substring(0, 8)}...</span>
                                            <span className="text-muted-foreground">{payoutService.formatDate(order.orderDate)}</span>
                                            <span className="font-medium">{payoutService.formatCurrency(order.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDetailsModal(false);
                                setSelectedProducerDetails(null);
                            }}
                        >
                            Close
                        </Button>
                        {selectedProducerDetails && selectedProducerDetails.status === 'SCHEDULED' && (
                            <Button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedPayout(selectedProducerDetails);
                                    setShowCompleteModal(true);
                                }}
                            >
                                Process Payout
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
};

export default PayoutManagement;
