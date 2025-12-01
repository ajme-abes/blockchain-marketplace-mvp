// src/pages/producer/StoreSettings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Store, MapPin, Phone, Mail, Globe, Loader2 } from 'lucide-react';
import BankAccountManagement from '@/components/producer/BankAccountManagement';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSettingsForm {
  businessName: string;
  location: string;
  phone: string;
  email: string;
}

const StoreSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [producerId, setProducerId] = useState<string>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StoreSettingsForm>();

  useEffect(() => {
    loadProducerData();
  }, []);

  const loadProducerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/producers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load producer data');

      const data = await response.json();
      console.log('Producer data:', data);

      // Set form values
      setValue('businessName', data.producer.businessName || '');
      setValue('location', data.producer.location || '');
      setValue('phone', data.producer.user?.phone || '');
      setValue('email', data.producer.user?.email || '');
      setProducerId(data.producer.id);

    } catch (error: any) {
      console.error('Failed to load producer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your store information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StoreSettingsForm) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/producers/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update store settings');

      toast({
        title: 'Success',
        description: 'Store settings updated successfully',
      });

      await loadProducerData();
    } catch (error: any) {
      console.error('Failed to update store settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update store settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Basic Store Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="h-5 w-5" />
                          Store Information
                        </CardTitle>
                        <CardDescription>
                          Manage your store's basic information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="businessName">Business Name *</Label>
                            <Input
                              id="businessName"
                              {...register('businessName', { required: 'Business name is required' })}
                            />
                            {errors.businessName && (
                              <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="location">Location *</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="location"
                                className="pl-10"
                                placeholder="e.g., Addis Ababa, Bole"
                                {...register('location', { required: 'Location is required' })}
                              />
                            </div>
                            {errors.location && (
                              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                            )}
                          </div>
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
                          How customers and admins can reach you
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                className="pl-10"
                                disabled
                                {...register('email')}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Email cannot be changed here
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                className="pl-10"
                                placeholder="+251 91 234 5678"
                                {...register('phone')}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" onClick={() => loadProducerData()}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Bank Account Management Section */}
                  <BankAccountManagement />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StoreSettings;