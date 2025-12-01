// frontend/src/components/producer/BankAccountManagement.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    CreditCard,
    Plus,
    Edit,
    Trash2,
    Star,
    Building2,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    branchName?: string;
    swiftCode?: string;
    accountType: string;
    isPrimary: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

const ETHIOPIAN_BANKS = [
    'Awash Bank',
    'Commercial Bank of Ethiopia (CBE)',
    'Bank of Abyssinia',
    'Dashen Bank',
    'Abay Bank',
    'Wegagen Bank',
    'United Bank',
    'Nib International Bank',
    'Cooperative Bank of Oromia',
    'Lion International Bank',
    'Oromia International Bank',
    'Zemen Bank',
    'Bunna International Bank',
    'Berhan International Bank',
    'Addis International Bank',
    'Debub Global Bank',
    'Enat Bank',
    'Telebirr',
    'M-Pesa Ethiopia',
    'Other'
];

const ACCOUNT_TYPES = [
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CHECKING', label: 'Checking Account' },
    { value: 'BUSINESS', label: 'Business Account' }
];

const BankAccountManagement = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        accountName: '',
        branchName: '',
        swiftCode: '',
        accountType: 'SAVINGS',
        isPrimary: false
    });

    useEffect(() => {
        loadBankAccounts();
    }, []);

    const loadBankAccounts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/bank-accounts/my-accounts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load bank accounts');

            const data = await response.json();
            setAccounts(data.accounts || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load bank accounts',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async () => {
        if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/bank-accounts/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to add bank account');

            toast({
                title: 'Success',
                description: 'Bank account added successfully',
            });

            setShowAddModal(false);
            resetForm();
            await loadBankAccounts();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add bank account',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateAccount = async () => {
        if (!selectedAccount) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/bank-accounts/${selectedAccount.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update bank account');

            toast({
                title: 'Success',
                description: 'Bank account updated successfully',
            });

            setShowEditModal(false);
            setSelectedAccount(null);
            resetForm();
            await loadBankAccounts();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update bank account',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!selectedAccount) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/bank-accounts/${selectedAccount.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete bank account');

            toast({
                title: 'Success',
                description: 'Bank account deleted successfully',
            });

            setShowDeleteDialog(false);
            setSelectedAccount(null);
            await loadBankAccounts();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete bank account',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleSetPrimary = async (accountId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/bank-accounts/${accountId}/set-primary`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to set primary account');

            toast({
                title: 'Success',
                description: 'Primary account updated successfully',
            });

            await loadBankAccounts();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to set primary account',
                variant: 'destructive',
            });
        }
    };

    const openEditModal = (account: BankAccount) => {
        setSelectedAccount(account);
        setFormData({
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            branchName: account.branchName || '',
            swiftCode: account.swiftCode || '',
            accountType: account.accountType,
            isPrimary: account.isPrimary
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            bankName: '',
            accountNumber: '',
            accountName: '',
            branchName: '',
            swiftCode: '',
            accountType: 'SAVINGS',
            isPrimary: false
        });
    };

    const maskAccountNumber = (accountNumber: string) => {
        if (accountNumber.length <= 4) return accountNumber;
        return `****${accountNumber.slice(-4)}`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Bank Accounts
                        </CardTitle>
                        <CardDescription>
                            Manage your bank accounts for receiving payouts
                        </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-8">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">No bank accounts</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add a bank account to receive your payouts
                        </p>
                        <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Account
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className={`p-4 border rounded-lg ${account.isPrimary ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium">{account.bankName}</h4>
                                            {account.isPrimary && (
                                                <Badge className="bg-blue-500">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Primary
                                                </Badge>
                                            )}
                                            {account.isVerified ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Pending Verification
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div>Account Name: <span className="font-medium text-foreground">{account.accountName}</span></div>
                                            <div>Account Number: <span className="font-medium text-foreground">{maskAccountNumber(account.accountNumber)}</span></div>
                                            {account.branchName && (
                                                <div>Branch: <span className="font-medium text-foreground">{account.branchName}</span></div>
                                            )}
                                            <div>Type: <span className="font-medium text-foreground">{account.accountType}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!account.isPrimary && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetPrimary(account.id)}
                                                title="Set as primary"
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(account)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add Account Dialog */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Bank Account</DialogTitle>
                        <DialogDescription>
                            Add a new bank account to receive your payouts
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Name *</label>
                            <Select
                                value={formData.bankName}
                                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ETHIOPIAN_BANKS.map((bank) => (
                                        <SelectItem key={bank} value={bank}>
                                            {bank}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Number *</label>
                            <Input
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                placeholder="Enter account number"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Holder Name *</label>
                            <Input
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                placeholder="Name as it appears on account"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branch Name (Optional)</label>
                            <Input
                                value={formData.branchName}
                                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                placeholder="e.g., Bole Branch"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Type</label>
                            <Select
                                value={formData.accountType}
                                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPrimary"
                                checked={formData.isPrimary}
                                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="isPrimary" className="text-sm">
                                Set as primary account for payouts
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAddModal(false);
                                resetForm();
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddAccount} disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Account'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Bank Account</DialogTitle>
                        <DialogDescription>
                            Update your bank account information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Name *</label>
                            <Select
                                value={formData.bankName}
                                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ETHIOPIAN_BANKS.map((bank) => (
                                        <SelectItem key={bank} value={bank}>
                                            {bank}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Number *</label>
                            <Input
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Holder Name *</label>
                            <Input
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branch Name (Optional)</label>
                            <Input
                                value={formData.branchName}
                                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Type</label>
                            <Select
                                value={formData.accountType}
                                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedAccount(null);
                                resetForm();
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateAccount} disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Account'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bank account? This action cannot be undone.
                            {selectedAccount?.isPrimary && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                    This is your primary account. You'll need to set another account as primary.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Account'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default BankAccountManagement;
