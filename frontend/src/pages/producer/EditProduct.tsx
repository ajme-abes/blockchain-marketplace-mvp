// src/pages/producer/EditProduct.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { productService, Product } from '@/services/productService';

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    quantityAvailable: '', // ✅ Fixed: quantity → quantityAvailable
  });

  const categories = [
    'vegetables', 'fruits', 'grains', 'dairy',
    'meat', 'spices', 'coffee', 'honey', 'other'
  ];

  useEffect(() => {
    if (!id) {
      toast({ title: "Error", description: "Product ID is missing", variant: "destructive" });
      navigate('/my-products');
      return;
    }
    loadProduct();
  }, [id, navigate, toast]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductById(id);
      setProduct(productData);

      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        category: productData.category || '',
        quantityAvailable: productData.quantityAvailable?.toString() || '0' // ✅ Fixed
      });

      if (productData.imageUrl) setImagePreview(productData.imageUrl);
    } catch (error: any) {
      toast({ title: "Error loading product", description: error.message || "Failed to load product details", variant: "destructive" });
      navigate('/my-products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setNewImage(file);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // In handleSubmit function - FIX FOR upload.array('images', 5)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
  
    try {
      setUpdating(true);
  
      // Validate form
      if (!formData.name || !formData.price || !formData.category || !formData.quantityAvailable) {
        toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
  
      // ✅ FIX: Use FormData with correct field names for upload.array()
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('quantity', formData.quantityAvailable); // Backend expects 'quantity'
  
      // ✅ FIX: Use 'images' field name and send as array (even for single file)
      if (newImage) {
        formDataToSend.append('images', newImage); // Field name MUST be 'images' (plural)
        console.log('🖼️ New image added to form data with field name "images":', newImage.name);
      }
  
      console.log('🔄 Updating product with data:', {
        name: formData.name,
        price: formData.price,
        category: formData.category,
        quantityAvailable: formData.quantityAvailable,
        hasNewImage: !!newImage,
        fieldName: 'images', // Using correct field name for upload.array()
        uploadType: 'array' // Backend expects multiple files
      });
  
      // Debug: Check what fields are being sent
      console.log('📋 FormData fields:');
      for (let pair of formDataToSend.entries()) {
        console.log('  ', pair[0], pair[1]);
      }
  
      // Use direct fetch to handle FormData properly
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log('✅ Product update response:', result);
  
      toast({ 
        title: "Product updated!", 
        description: "Your product has been updated successfully" 
      });
      
      navigate('/my-products');
      
    } catch (error: any) {
      console.error('❌ Failed to update product:', error);
      toast({ 
        title: "Error updating product", 
        description: error.message || "Failed to update product", 
        variant: "destructive" 
      });
    } finally {
      setUpdating(false);
    }
  };
  const handleCancel = () => navigate('/my-products');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <Button onClick={handleCancel}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">Edit Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Image Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>Update your product image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square border-2 border-dashed rounded-lg overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label htmlFor="image">Change Image</Label>
                  <Input 
                    id="image" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="mt-1" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP up to 5MB
                  </p>
                </div>
                {newImage && (
                  <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                    New image selected: {newImage.name}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Update your product details and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => handleInputChange('description', e.target.value)} 
                    rows={4} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (ETB) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={formData.price} 
                      onChange={(e) => handleInputChange('price', e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantityAvailable">Available Quantity *</Label>
                  <Input
                    id="quantityAvailable"
                    type="number"
                    min="0"
                    value={formData.quantityAvailable}
                    onChange={(e) => handleInputChange('quantityAvailable', e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="flex items-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Product
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel} 
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;