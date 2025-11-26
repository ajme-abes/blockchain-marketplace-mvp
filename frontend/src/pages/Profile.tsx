// src/pages/Profile.tsx - ENHANCED VERSION
import { useEffect, useRef, useState } from 'react';
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
import { 
  Camera, 
  Save, 
  ShieldCheck, 
  Upload, 
  MessageSquare, 
  Loader2, 
  MapPin, 
  Mail, 
  Phone, 
  Key,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED';
  rejectionReason?: string | null;
  joinDate: string;
}

interface ProducerDocument {
  id: string;
  type: string;
  url: string;
  filename: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
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
  const [documents, setDocuments] = useState<ProducerDocument[]>([]);
  const [docType, setDocType] = useState<string>('BUSINESS_LICENSE');
  const [docUploading, setDocUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    phone: profileData?.phone || '',
    address: profileData?.address || '', 
    region: profileData?.region || '',
    bio: profileData?.bio || '',
  });

  const isOwnProfile = !id || id === user?.id;
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const documentTypeOptions = [
    { value: 'BUSINESS_LICENSE', label: 'Business License' },
    { value: 'TAX_ID', label: 'Tax Identification' },
    { value: 'GOVERNMENT_ID', label: 'Government ID' },
    { value: 'COOPERATIVE_CERT', label: 'Cooperative Certificate' },
    { value: 'OTHER', label: 'Other Document' },
  ];

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
          const verificationStatus = response.data.producerProfile?.verificationStatus || 'NOT_SUBMITTED';
          const rejectionReason = response.data.producerProfile?.rejectionReason || null;

          setProfileData({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            region: response.data.region || '',
            bio: response.data.bio || '',
            role: response.data.role,
            avatarUrl: response.data.avatarUrl || '',
            isVerified: verificationStatus === 'VERIFIED',
            verificationStatus,
            rejectionReason,
            joinDate: response.data.registrationDate || response.data.joinDate || new Date().toISOString(),
          });
          
          setFormData({
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            region: response.data.region || '',
            bio: response.data.bio || '',
          });

          if (response.data.role === 'PRODUCER') {
            await fetchProducerDocuments();
          } else {
            setDocuments([]);
          }
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
            avatarUrl: user!.avatarUrl || '',
            isVerified: user!.isVerified || false,
            verificationStatus: user!.isVerified ? 'VERIFIED' : 'NOT_SUBMITTED',
            joinDate: user!.joinDate || new Date().toISOString(),
          });
          setDocuments([]);
        }
      } else {
        // For viewing other profiles, fetch from API
        const response = await userService.getUserProfile(id!);
        const verificationStatus = response.data.producerProfile?.verificationStatus || 'NOT_SUBMITTED';
        const rejectionReason = response.data.producerProfile?.rejectionReason || null;
        setProfileData({
          ...response.data,
          isVerified: verificationStatus === 'VERIFIED',
          verificationStatus,
          rejectionReason,
        });
        setDocuments([]);
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

  const fetchProducerDocuments = async () => {
    try {
      const response = await userService.getProducerDocuments();
      const docsPayload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : response?.data?.documents || [];
      setDocuments(docsPayload as ProducerDocument[]);
    } catch (error: any) {
      console.error('Failed to fetch producer documents:', error);
      setDocuments([]);
      toast({
        title: 'Unable to load documents',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
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
  const handleVerificationDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a document smaller than 10MB.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    try {
      setDocUploading(true);
      await userService.uploadVerificationDocument(file, docType);
      toast({
        title: 'Document uploaded',
        description: 'Your verification document has been submitted for review.',
      });

      if (profileData) {
        setProfileData({
          ...profileData,
          verificationStatus: 'PENDING',
          isVerified: false,
          rejectionReason: null,
        });
      }

      await fetchProducerDocuments();
    } catch (error: any) {
      console.error('Failed to upload verification document:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload verification document',
        variant: 'destructive',
      });
    } finally {
      setDocUploading(false);
      e.target.value = '';
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getVerificationStatusMeta = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verified',
          description: 'Your business is verified and trusted by buyers.',
          badgeVariant: 'default' as const,
        };
      case 'PENDING':
        return {
          label: 'Pending Verification',
          description: 'Documents submitted and awaiting review from admins.',
          badgeVariant: 'secondary' as const,
        };
      case 'REJECTED':
        return {
          label: 'Verification Rejected',
          description: 'Please review admin feedback and resubmit required documents.',
          badgeVariant: 'destructive' as const,
        };
      default:
        return {
          label: 'Not Verified',
          description: 'Upload business documents to complete verification.',
          badgeVariant: 'outline' as const,
        };
    }
  };

  const formatDocumentType = (type: string) => {
    const map: Record<string, string> = {
      BUSINESS_LICENSE: 'Business License',
      TAX_ID: 'Tax Identification',
      GOVERNMENT_ID: 'Government ID',
      COOPERATIVE_CERT: 'Cooperative Certificate',
      OTHER: 'Other',
    };
    return map[type] || type;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

            {/* Producer Verification */}
            {profileData.role === "PRODUCER" && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Business Verification</CardTitle>
                  <CardDescription>
                    Verify your business to build trust with buyers
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Verification Status</p>
                        <p className="text-sm text-muted-foreground">
                          {getVerificationStatusMeta(profileData.verificationStatus).description}
                        </p>
                      </div>

                      <Badge variant={getVerificationStatusMeta(profileData.verificationStatus).badgeVariant}>
                        {getVerificationStatusMeta(profileData.verificationStatus).label}
                      </Badge>
                    </div>

                    {profileData.verificationStatus === 'REJECTED' && profileData.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/10">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-destructive">Verification rejected</p>
                          <p className="text-sm text-destructive/90">{profileData.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="font-medium">Submitted Documents</p>
                      {documents.length > 0 ? (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-primary" />
                                <div>
                                  <p className="font-semibold">{doc.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDocumentType(doc.type)} • {new Date(doc.uploadedAt).toLocaleDateString()} • {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={doc.url} target="_blank" rel="noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="font-medium">Upload New Document</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Document Type</Label>
                          <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col justify-end">
                          <input
                            ref={documentInputRef}
                            id="verification-doc-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={handleVerificationDocumentUpload}
                          />
                          <Button
                            variant="outline"
                            onClick={() => documentInputRef.current?.click()}
                            disabled={docUploading}
                          >
                            {docUploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {docUploading ? 'Uploading...' : 'Select & Upload'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Accepts PDF or image files up to 10MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
<Button variant="outline" onClick={() => navigate("/change-password")} className="flex items-center gap-2">
<Key className="h-4 w-4" />
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
