// src/pages/producer/EditProduct.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import { productService, Product, CreateProductData } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  region: string;
  stock: number;
  unit: string;
}

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>();

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const productData = await productService.getProduct(id);
        setProduct(productData);
        setExistingImages(productData.images);
        
        // Reset form with product data
        reset({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          region: productData.region,
          stock: productData.stock,
          unit: productData.unit,
        });
      } catch (error: any) {
        console.error('Failed to load product:', error);
        toast({
          title: "Error loading product",
          description: error.message || "Product not found",
          variant: "destructive",
        });
        navigate('/my-products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, reset, navigate, toast]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const updateData: Partial<CreateProductData> = {
        ...data,
        price: Number(data.price),
        stock: Number(data.stock),
      };

      // Only include images if new ones were added
      if (newImages.length > 0) {
        updateData.images = newImages;
      }

      await productService.updateProduct(id, updateData);
      
      toast({
        title: "Product updated!",
        description: "Your product has been updated successfully",
      });
      
      navigate('/my-products');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error updating product",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const uploadedImages = Array.from(files).slice(0, 5 - (existingImages.length + newImages.length));
      setNewImages(prev => [...prev, ...uploadedImages]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const allImages = [...existingImages.map(url => ({ type: 'existing' as const, url })), ...newImages.map(file => ({ type: 'new' as const, file }))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/my-products')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-4xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update your product information
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Same form fields as AddProduct but with current values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { 
                      required: 'Product name is required',
                      minLength: {
                        value: 3,
                        message: 'Product name must be at least 3 characters'
                      }
                    })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    {...register('category', { required: 'Category is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Category</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="dairy">Dairy</option>
                    <option value="spices">Spices</option>
                    <option value="coffee">Coffee</option>
                    <option value="honey">Honey</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Price (ETB) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 1, message: 'Price must be at least 1 ETB' }
                    })}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="1"
                    {...register('stock', { 
                      required: 'Stock is required',
                      min: { value: 1, message: 'Stock must be at least 1' }
                    })}
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    {...register('unit', { required: 'Unit is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="piece">Piece</option>
                    <option value="bundle">Bundle</option>
                    <option value="liter">Liter</option>
                    <option value="dozen">Dozen</option>
                  </select>
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="region">Region *</Label>
                  <select
                    id="region"
                    {...register('region', { required: 'Region is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Region</option>
                    <option value="addis-ababa">Addis Ababa</option>
                    <option value="oromia">Oromia</option>
                    <option value="amhara">Amhara</option>
                    <option value="snnpr">SNNPR</option>
                    <option value="tigray">Tigray</option>
                    <option value="afar">Afar</option>
                    <option value="somali">Somali</option>
                    <option value="benishangul-gumuz">Benishangul-Gumuz</option>
                    <option value="gambela">Gambela</option>
                    <option value="harari">Harari</option>
                    <option value="diredawa">Dire Dawa</option>
                  </select>
                  {errors.region && (
                    <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters'
                    }
                  })}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Image Management */}
              <div>
                <Label>Product Images</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Current images and new uploads. First image is the main display.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {allImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.type === 'existing' ? image.url : URL.createObjectURL(image.file)}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => image.type === 'existing' ? removeExistingImage(index) : removeNewImage(index - existingImages.length)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {allImages.length < 5 && (
                    <label className="border-2 border-dashed border-muted-foreground rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Add Image</span>
                        <span className="text-xs text-muted-foreground block">
                          {5 - allImages.length} remaining
                        </span>
                      </div>
                    </label>
                  )}
                </div>
                {allImages.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">At least one image is required</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/my-products')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EditProduct;