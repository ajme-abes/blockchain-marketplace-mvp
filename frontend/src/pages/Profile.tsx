// src/pages/Profile.tsx - ENHANCED VERSION
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Save, ShieldCheck, Upload, MessageSquare, Loader2, MapPin, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  region: string;
  bio: string;
  role: string;
  avatarUrl?: string;
  isVerified: boolean;
  joinDate: string;
}

const Profile = () => {
  const { id } = useParams();
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    phone: profileData?.phone || '',
    address: profileData?.address || '', 
    region: profileData?.region || '',
    bio: profileData?.bio || '',
  });

  const isOwnProfile = !id || id === user?.id;

  useEffect(() => {
    if (isOwnProfile && !isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [id, isAuthenticated, navigate, isOwnProfile]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      if (isOwnProfile) {
        // ALWAYS fetch fresh data from API to get the latest avatarUrl
        try {
          const response = await userService.getUserProfile(user!.id);
          console.log('🔧 Fresh profile data from API:', response.data);
          setProfileData({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            region: response.data.region || '',
            bio: response.data.bio || '',
            role: response.data.role,
            avatarUrl: response.data.avatarUrl || '', // This will get the actual avatarUrl from DB
            isVerified: response.data.isVerified || false,
            joinDate: response.data.registrationDate || response.data.joinDate || new Date().toISOString(),
          });
          
          setFormData({
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            region: response.data.region || '',
            bio: response.data.bio || '',
          });
        } catch (apiError) {
          console.error('Failed to fetch from API, using auth context:', apiError);
          // Fallback to auth context if API fails
          setProfileData({
            id: user!.id,
            name: user!.name,
            email: user!.email,
            phone: user!.phone || '',
            region: user!.region || '',
            bio: user!.bio || '',
            role: user!.role,
            avatarUrl: user!.avatarUrl || '', // This might still be empty
            isVerified: user!.isVerified || false,
            joinDate: user!.joinDate || new Date().toISOString(),
          });
        }
      } else {
        // For viewing other profiles, fetch from API
        const response = await userService.getUserProfile(id!);
        setProfileData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('🔧 Saving profile data:', formData);
      
      // Update profile via API
      const response = await userService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        region: formData.region,
        bio: formData.bio,
      });
  
      console.log('✅ Profile update response:', response);
  
      // Update local auth state
      if (updateUser) {
        updateUser({
          ...user!,
          name: formData.name,
          phone: formData.phone,
          region: formData.region,
          bio: formData.bio,
        });
      }
  
      // Update local profile data
      setProfileData(prev => prev ? {
        ...prev,
        name: formData.name,
        phone: formData.phone,
        region: formData.region,
        bio: formData.bio,
      } : null);
  
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  

  // In Profile.tsx - FIX THE handleAvatarUpload FUNCTION
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }
  
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setSaving(true);
      
      console.log('🔧 Starting avatar upload...');
      
      const response = await userService.uploadAvatar(file);
      
      console.log('✅ Avatar upload completed:', response);
  
      // FIX: Update local state with the new avatar URL from the BACKEND RESPONSE
      // Use the user data returned from the backend, not ipfsResult
      if (response.data && response.data.avatarUrl) {
        const newAvatarUrl = response.data.avatarUrl;
        
        console.log('🔄 Updating profile with new avatar URL:', newAvatarUrl);
        
        // Update local profile state
        setProfileData(prev => prev ? { 
          ...prev, 
          avatarUrl: newAvatarUrl 
        } : null);
        
        // Also update the auth context user if available
        if (updateUser && user) {
          updateUser({
            ...user,
            avatarUrl: newAvatarUrl
          });
        }
  
        // Show success message
        toast({
          title: 'Avatar Updated',
          description: 'Your profile picture has been updated successfully.',
        });
      } else {
        console.error('❌ No avatar URL in response:', response);
        toast({
          title: "Upload Issue",
          description: "Avatar uploaded but failed to update display.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      // Reset the input
      e.target.value = '';
    }
  };
  const handleKYCUpload = async () => {
    try {
      // Implement KYC upload logic
      toast({
        title: 'KYC Document Uploaded',
        description: 'Your verification documents have been submitted for review.',
      });
    } catch (error: any) {
      console.error('Failed to upload KYC:', error);
      toast({
        title: "Error",
        description: "Failed to upload verification documents",
        variant: "destructive",
      });
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  // Public profile view (viewing someone else's profile)
  if (!isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profileData.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                      <Badge variant="outline" className="capitalize">
                        {profileData.role}
                      </Badge>
                      {profileData.role === 'PRODUCER' && profileData.isVerified && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verified Producer
                        </Badge>
                      )}
                    </div>
                    {profileData.region && (
                      <p className="text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-1">
                        <MapPin className="h-4 w-4" />
                        {profileData.region}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Joined {formatJoinDate(profileData.joinDate)}
                    </p>
                  </div>
                  {isAuthenticated && (
                    <Button onClick={() => navigate(`/chats?user=${profileData.id}`)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bio Section */}
            {profileData.bio && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{profileData.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{profileData.phone}</p>
                    </div>
                  </div>
                )}
                {profileData.region && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{profileData.region}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Own profile view with editing capabilities
return (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <PageHeader 
          title="My Profile" 
          description="Manage your personal information and account settings"
        />

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Profile Header */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">

                  {/* Avatar Section (fixed duplicate issue) */}
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {profileData.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Upload button */}
                    <div className="absolute bottom-0 right-0">
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={saving}
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full"
                        disabled={saving}
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                      <Badge variant="outline" className="capitalize">
                        {profileData.role.toLowerCase()}
                      </Badge>

                      {profileData.role === "PRODUCER" && profileData.isVerified && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}

                      {profileData.role === "PRODUCER" && !profileData.isVerified && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Pending Verification
                        </Badge>
                      )}
                    </div>

                    {profileData.region && (
                      <p className="text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-1">
                        <MapPin className="h-4 w-4" />
                        {profileData.region}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground mt-1">
                      Member since {formatJoinDate(profileData.joinDate)}
                    </p>
                  </div>

                  <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={saving}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing || saving}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing || saving}
                      placeholder="+251 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      disabled={!isEditing || saving}
                      placeholder="e.g., Addis Ababa, Oromia"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing || saving}
                    rows={4}
                    placeholder={
                      profileData.role === "PRODUCER"
                        ? "Tell buyers about your farm, products, and farming practices..."
                        : "Tell others about yourself and your interests..."
                    }
                  />
                </div>

                {isEditing && (
                  <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Producer KYC */}
            {profileData.role === "PRODUCER" && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Business Verification</CardTitle>
                  <CardDescription>
                    Verify your business to build trust with buyers
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Verification Status</p>
                      <p className="text-sm text-muted-foreground">
                        {profileData.isVerified
                          ? "Your business is verified and trusted by buyers"
                          : "Complete verification to increase buyer confidence"}
                      </p>
                    </div>

                    <Badge variant={profileData.isVerified ? "default" : "secondary"}>
                      {profileData.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  {!profileData.isVerified && (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload business license, farm certification, or government ID
                      </p>

                      <Button variant="outline" onClick={handleKYCUpload} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Security */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">
                      Update your password regularly for security
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate("/change-password")}>
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>

                  <Button variant="outline" onClick={() => navigate("/security")}>
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  </SidebarProvider>
);
};

export default Profile;
