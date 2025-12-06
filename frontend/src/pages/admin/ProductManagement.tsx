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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Package,
  Eye,
  Download,
  RefreshCw,
  MoreVertical,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Edit,
  Trash2,
  ShoppingCart,
  Store,
  BarChart3,
  Users,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for product data
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  quantityAvailable: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'PENDING_REVIEW' | 'REJECTED';
  imageUrl?: string;
  averageRating: number | null;
  reviewCount: number;
  orderCount: number;
  listingDate: string;
  updatedAt: string;
  producer: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    location: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  ipfsFiles?: Array<{
    id: string;
    cid: string;
    name?: string;
    mimeType?: string;
  }>;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ProductStats {
  overview: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    outOfStockProducts: number;
    totalProducers: number;
  };
  categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    status: string;
    producer: string;
    listingDate: string;
  }>;
  charts: {
    statusDistribution: Array<{
      status: string;
      count: number;
    }>;
  };
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'activate' | 'deactivate' | 'approve' | 'reject' | 'delete' | null>(null);
  const [selectedBulkAction, setSelectedBulkAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  // Fetch products from backend
  const fetchProducts = async (page = 1, search = '') => {
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
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (verificationFilter !== 'all') {
        params.append('verificationStatus', verificationFilter);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();

        if (result.status === 'success') {
          setProducts(result.data.products || []);
          setPagination(result.data.pagination || {
            page: 1,
            limit: 20,
            total: result.data.products?.length || 0,
            pages: 1
          });
        }
      } else {
        console.error('Failed to fetch products');
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch product statistics
  const fetchProductStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/products/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching product stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProductStats();
  }, [statusFilter, categoryFilter, verificationFilter]);

  // Handle product actions
  const handleProductAction = async (action: string, productId: string, reason?: string) => {
    try {
      const token = localStorage.getItem('authToken');

      let endpoint = 'status';
      let method = 'PATCH';
      let body: any = {};

      switch (action) {
        case 'activate':
          body = { status: 'ACTIVE' };
          break;
        case 'deactivate':
          body = { status: 'INACTIVE', reason };
          break;
        case 'approve':
          body = { status: 'ACTIVE' };
          break;
        case 'reject':
          body = { status: 'REJECTED', reason };
          break;
        case 'delete':
          endpoint = '';
          method = 'DELETE';
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/products/${productId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        const actionText = action === 'activate' ? 'activated' :
          action === 'deactivate' ? 'deactivated' :
            action === 'approve' ? 'approved' :
              action === 'reject' ? 'rejected' : 'deleted';

        toast({
          title: `Product ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          description: `Product has been ${actionText} successfully.`,
        });

        fetchProducts(pagination.page, searchQuery);
        fetchProductStats();
        setActionDialogOpen(false);
        setProductDetailOpen(false);
        setSelectedProducts([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('Product action error:', error);
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, reason?: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/products/bulk-actions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productIds: selectedProducts,
          action,
          reason
        })
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: 'Bulk Action Completed',
          description: result.message || `Bulk action completed successfully`,
        });

        fetchProducts(pagination.page, searchQuery);
        fetchProductStats();
        setBulkActionDialogOpen(false);
        setSelectedProducts([]);
        setSelectedBulkAction('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Bulk Action Failed',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchProducts(1, value);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products on current page
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, className: 'bg-green-500', label: 'Active' },
      INACTIVE: { variant: 'secondary' as const, className: 'bg-gray-500', label: 'Inactive' },
      OUT_OF_STOCK: { variant: 'outline' as const, className: 'bg-orange-500/10 text-orange-700 border-orange-500/20', label: 'Out of Stock' },
      PENDING_REVIEW: { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Pending Review' },
      REJECTED: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Get verification badge
  const getVerificationBadge = (status: string) => {
    const config = {
      VERIFIED: { variant: 'default' as const, className: 'bg-green-500', label: 'Verified' },
      PENDING: { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Pending' },
      REJECTED: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Rejected' }
    };

    const badgeConfig = config[status as keyof typeof config] || config.PENDING;

    return (
      <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
        {badgeConfig.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get available categories from stats
  const availableCategories = stats?.categories?.map(cat => cat.category) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="Product Management"
            description="Manage all products, approve listings, and monitor product performance"
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchProducts(1, searchQuery);
                    fetchProductStats();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              {!statsLoading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.totalProducts}</div>
                          <div className="text-sm text-muted-foreground">Total Products</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.activeProducts}</div>
                          <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.outOfStockProducts}</div>
                          <div className="text-sm text-muted-foreground">Out of Stock</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Ban className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.inactiveProducts}</div>
                          <div className="text-sm text-muted-foreground">Inactive</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Store className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.totalProducers}</div>
                          <div className="text-sm text-muted-foreground">Producers</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Bulk Actions Bar */}
              {selectedProducts.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-blue-600">
                          {selectedProducts.length} selected
                        </Badge>
                        <span className="text-sm text-blue-700">
                          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for bulk action
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Bulk Actions
                              <MoreVertical className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBulkAction('activate');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBulkAction('deactivate');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate Selected
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBulkAction('approve');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBulkAction('reject');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Selected
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBulkAction('delete');
                                setBulkActionDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Selected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProducts([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products by name, description, category, or producer..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                          <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {availableCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Producer Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Producers</SelectItem>
                          <SelectItem value="VERIFIED">Verified</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
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

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Products ({pagination.total})
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        {products.filter(p => p.status === 'ACTIVE').length} Active
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                        {products.filter(p => p.status === 'PENDING_REVIEW').length} Pending
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading products...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedProducts.length === products.length && products.length > 0}
                                  onCheckedChange={toggleSelectAll}
                                  aria-label="Select all"
                                />
                              </TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Producer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Listed</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.length > 0 ? (
                              products.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedProducts.includes(product.id)}
                                      onCheckedChange={() => toggleProductSelection(product.id)}
                                      aria-label={`Select ${product.name}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        {product.imageUrl ? (
                                          <AvatarImage
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="object-cover"
                                          />
                                        ) : (
                                          <AvatarFallback className="bg-muted">
                                            <ImageIcon className="h-4 w-4" />
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate">{product.name}</div>
                                        <div className="text-sm text-muted-foreground truncate">
                                          {product.description || 'No description'}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                          {product.averageRating && (
                                            <>
                                              <TrendingUp className="h-3 w-3 text-yellow-500" />
                                              <span className="text-xs text-muted-foreground">
                                                {product.averageRating} ({product.reviewCount} reviews)
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{formatCurrency(product.price)}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {product.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className={`text-sm font-medium ${product.quantityAvailable > 10 ? 'text-green-600' :
                                      product.quantityAvailable > 0 ? 'text-orange-600' : 'text-red-600'
                                      }`}>
                                      {product.quantityAvailable} units
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium text-sm">
                                        {product.producer.businessName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {product.producer.user.name}
                                      </div>
                                      {getVerificationBadge(product.producer.verificationStatus)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(product.status)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {new Date(product.listingDate).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          setProductDetailOpen(true);
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
                                            onClick={() => navigate(`/products/${product.id}`)}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View in Marketplace
                                          </DropdownMenuItem>

                                          {product.status === 'PENDING_REVIEW' && (
                                            <>
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedProduct(product);
                                                  setSelectedAction('approve');
                                                  setActionDialogOpen(true);
                                                }}
                                              >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve Product
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedProduct(product);
                                                  setSelectedAction('reject');
                                                  setActionDialogOpen(true);
                                                }}
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject Product
                                              </DropdownMenuItem>
                                            </>
                                          )}

                                          {product.status === 'ACTIVE' && (
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedProduct(product);
                                                setSelectedAction('deactivate');
                                                setActionDialogOpen(true);
                                              }}
                                            >
                                              <Ban className="h-4 w-4 mr-2" />
                                              Deactivate
                                            </DropdownMenuItem>
                                          )}

                                          {(product.status === 'INACTIVE' || product.status === 'REJECTED') && (
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedProduct(product);
                                                setSelectedAction('activate');
                                                setActionDialogOpen(true);
                                              }}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Activate
                                            </DropdownMenuItem>
                                          )}

                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              setSelectedAction('delete');
                                              setActionDialogOpen(true);
                                            }}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Product
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <div>No products found</div>
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
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchProducts(pagination.page - 1, searchQuery)}
                              disabled={pagination.page === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchProducts(pagination.page + 1, searchQuery)}
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

      {/* Product Detail Dialog */}
      <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about the product and its performance.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 flex-shrink-0">
                  {selectedProduct.imageUrl ? (
                    <AvatarImage
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-muted text-lg">
                      <ImageIcon className="h-6 w-6" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {selectedProduct.category}
                    </Badge>
                    {getStatusBadge(selectedProduct.status)}
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedProduct.price)}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {selectedProduct.description || 'No description available'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/products/${selectedProduct.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View in Marketplace
                  </Button>
                </div>
              </div>

              {/* Product Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedProduct.quantityAvailable}</div>
                  <div className="text-sm text-muted-foreground">In Stock</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedProduct.orderCount}</div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedProduct.averageRating || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedProduct.reviewCount}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </div>
              </div>

              {/* Producer Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Producer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Business Name</div>
                    <div className="font-medium">{selectedProduct.producer.businessName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact Person</div>
                    <div className="font-medium">{selectedProduct.producer.user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{selectedProduct.producer.user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{selectedProduct.producer.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Verification Status</div>
                    <div>{getVerificationBadge(selectedProduct.producer.verificationStatus)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Listed On</div>
                    <div className="font-medium">
                      {new Date(selectedProduct.listingDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.status === 'PENDING_REVIEW' && (
                    <>
                      <Button
                        onClick={() => {
                          setSelectedAction('approve');
                          setActionDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Product
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedAction('reject');
                          setActionDialogOpen(true);
                        }}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Product
                      </Button>
                    </>
                  )}
                  {selectedProduct.status === 'ACTIVE' && (
                    <Button
                      onClick={() => {
                        setSelectedAction('deactivate');
                        setActionDialogOpen(true);
                      }}
                      variant="outline"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Deactivate Product
                    </Button>
                  )}
                  {(selectedProduct.status === 'INACTIVE' || selectedProduct.status === 'REJECTED') && (
                    <Button
                      onClick={() => {
                        setSelectedAction('activate');
                        setActionDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate Product
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedAction('delete');
                      setActionDialogOpen(true);
                    }}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction === 'activate' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedAction === 'deactivate' && <Ban className="h-5 w-5 text-orange-500" />}
              {selectedAction === 'approve' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedAction === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
              {selectedAction === 'delete' && <Trash2 className="h-5 w-5 text-red-500" />}
              {selectedAction === 'activate' && 'Activate Product'}
              {selectedAction === 'deactivate' && 'Deactivate Product'}
              {selectedAction === 'approve' && 'Approve Product'}
              {selectedAction === 'reject' && 'Reject Product'}
              {selectedAction === 'delete' && 'Delete Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'activate' && 'Are you sure you want to activate this product? It will become visible to buyers.'}
              {selectedAction === 'deactivate' && 'Are you sure you want to deactivate this product? It will be hidden from buyers.'}
              {selectedAction === 'approve' && 'Are you sure you want to approve this product? It will become active and visible to buyers.'}
              {selectedAction === 'reject' && 'Are you sure you want to reject this product? The producer will need to resubmit.'}
              {selectedAction === 'delete' && 'Are you sure you want to delete this product? This action cannot be undone and will remove all product data.'}
            </DialogDescription>
          </DialogHeader>

          {(selectedAction === 'deactivate' || selectedAction === 'reject') && (
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
                selectedAction === 'delete' || selectedAction === 'reject'
                  ? 'destructive'
                  : 'default'
              }
              onClick={() => {
                if (selectedProduct && selectedAction) {
                  handleProductAction(selectedAction, selectedProduct.id, actionReason);
                }
              }}
            >
              {selectedAction === 'activate' && 'Activate Product'}
              {selectedAction === 'deactivate' && 'Deactivate Product'}
              {selectedAction === 'approve' && 'Approve Product'}
              {selectedAction === 'reject' && 'Reject Product'}
              {selectedAction === 'delete' && 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBulkAction === 'activate' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedBulkAction === 'deactivate' && <Ban className="h-5 w-5 text-orange-500" />}
              {selectedBulkAction === 'approve' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {selectedBulkAction === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
              {selectedBulkAction === 'delete' && <Trash2 className="h-5 w-5 text-red-500" />}
              Bulk {selectedBulkAction.charAt(0).toUpperCase() + selectedBulkAction.slice(1)} Products
            </DialogTitle>
            <DialogDescription>
              You are about to {selectedBulkAction} {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}.
              {selectedBulkAction === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {(selectedBulkAction === 'deactivate' || selectedBulkAction === 'reject') && (
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
                setBulkActionDialogOpen(false);
                setActionReason('');
                setSelectedBulkAction('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedBulkAction === 'delete' || selectedBulkAction === 'reject'
                  ? 'destructive'
                  : 'default'
              }
              onClick={() => {
                handleBulkAction(selectedBulkAction, actionReason);
              }}
            >
              {selectedBulkAction === 'activate' && `Activate ${selectedProducts.length} Products`}
              {selectedBulkAction === 'deactivate' && `Deactivate ${selectedProducts.length} Products`}
              {selectedBulkAction === 'approve' && `Approve ${selectedProducts.length} Products`}
              {selectedBulkAction === 'reject' && `Reject ${selectedProducts.length} Products`}
              {selectedBulkAction === 'delete' && `Delete ${selectedProducts.length} Products`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ProductManagement;