// src/pages/producer/StoreSettings.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Store, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface StoreSettingsForm {
  storeName: string;
  description: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  region: string;
  website?: string;
  isActive: boolean;
  acceptReturns: boolean;
  shippingEnabled: boolean;
}

const StoreSettings = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StoreSettingsForm>({
    defaultValues: {
      storeName: "Ethio Coffee Farm",
      description: "Premium organic coffee beans from the highlands of Ethiopia",
      contactEmail: "contact@ethiocoffee.com",
      phoneNumber: "+251 91 234 5678",
      address: "Bole Road, Addis Ababa",
      region: "addis-ababa",
      website: "www.ethiocoffee.com",
      isActive: true,
      acceptReturns: true,
      shippingEnabled: true,
    }
  });

  const onSubmit = (data: StoreSettingsForm) => {
    console.log('Store settings updated:', data);
    // TODO: Implement store settings update
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">Store Settings</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Store Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Store Information
                    </CardTitle>
                    <CardDescription>
                      Manage your store's basic information and branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storeName">Store Name *</Label>
                        <Input
                          id="storeName"
                          {...register('storeName', { required: 'Store name is required' })}
                        />
                        {errors.storeName && (
                          <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="region">Region *</Label>
                        <select
                          id="region"
                          {...register('region', { required: 'Region is required' })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="addis-ababa">Addis Ababa</option>
                          <option value="oromia">Oromia</option>
                          <option value="amhara">Amhara</option>
                          <option value="snnpr">SNNPR</option>
                          <option value="tigray">Tigray</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Store Description</Label>
                      <Textarea
                        id="description"
                        rows={3}
                        placeholder="Describe your store and what makes it special..."
                        {...register('description')}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      How customers can reach you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactEmail">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contactEmail"
                            type="email"
                            className="pl-10"
                            {...register('contactEmail', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Invalid email address'
                              }
                            })}
                          />
                        </div>
                        {errors.contactEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          {...register('phoneNumber')}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Store Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          className="pl-10"
                          {...register('address')}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          className="pl-10"
                          {...register('website')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Store Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Store Preferences</CardTitle>
                    <CardDescription>
                      Configure your store's behavior and policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isActive">Store Active</Label>
                        <p className="text-sm text-muted-foreground">
                          When disabled, customers cannot see your products
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        {...register('isActive')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="acceptReturns">Accept Returns</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow customers to return products
                        </p>
                      </div>
                      <Switch
                        id="acceptReturns"
                        {...register('acceptReturns')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="shippingEnabled">Enable Shipping</Label>
                        <p className="text-sm text-muted-foreground">
                          Offer shipping to customers
                        </p>
                      </div>
                      <Switch
                        id="shippingEnabled"
                        {...register('shippingEnabled')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StoreSettings;