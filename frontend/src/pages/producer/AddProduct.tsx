// src/pages/producer/AddProduct.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Plus, X, ArrowLeft, Loader2 } from 'lucide-react';
import { productService, CreateProductData } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  region: string;
  quantity: number;
  unit: string;
}

const AddProduct: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>();

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData: CreateProductData = {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        images: images,
      };

      console.log('🔄 Creating product with data:', {
        ...productData,
        imagesCount: productData.images.length
      });
      
      const result = await productService.createProduct(productData);
      
      console.log('✅ Product created successfully:', result);
      
      toast({
        title: "Product created!",
        description: "Your product has been listed successfully",
      });
      
      navigate('/my-products');
    } catch (error: any) {
      console.error('❌ Failed to create product:', error);
      toast({
        title: "Error creating product",
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
      const newImages = Array.from(files).slice(0, 5 - images.length); // Max 5 images
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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
            <h1 className="text-4xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">
              List your products to start selling
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Fresh Tomatoes"
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

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    {...register('category', { required: 'Category is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

                {/* Price */}
                <div>
                  <Label htmlFor="price">Price (ETB) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 1, message: 'Price must be at least 1 ETB' }
                    })}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                  )}
                </div>

                {/* quantity */}
                <div>
                  <Label htmlFor="quantity">quantity Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="0"
                    {...register('quantity', { 
                      required: 'quantity is required',
                      min: { value: 1, message: 'quantity must be at least 1' }
                    })}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    {...register('unit', { required: 'Unit is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

                {/* Region */}
                <div>
                  <Label htmlFor="region">Region *</Label>
                  <select
                    id="region"
                    {...register('region', { required: 'Region is required' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe your product in detail... Include quality, freshness, growing methods, etc."
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

              {/* Image Upload */}
              <div>
                <Label>Product Images *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload up to 5 images. First image will be the main display.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
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
                  
                  {images.length < 5 && (
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
                          {5 - images.length} remaining
                        </span>
                      </div>
                    </label>
                  )}
                </div>
                {images.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">At least one image is required</p>
                )}
              </div>

              {/* Submit Buttons */}
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
                      Creating Product...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/my-products')}
                  disabled={isSubmitting}
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

export default AddProduct;