import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Save, ShieldCheck, Upload, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Mock user data for viewing other profiles
  const mockUsers: Record<string, any> = {
    '1': {
      id: '1',
      name: 'Abebe Kebede',
      email: 'abebe@example.com',
      phone: '+251911234567',
      region: 'Addis Ababa',
      role: 'producer',
      bio: 'Experienced coffee producer with 15 years in the industry. Growing premium arabica coffee in the highlands of Ethiopia.',
    },
    '2': {
      id: '2',
      name: 'Tigist Alemu',
      email: 'tigist@example.com',
      phone: '+251922334455',
      region: 'Oromia',
      role: 'producer',
      bio: 'Organic honey producer dedicated to sustainable beekeeping practices.',
    },
  };

  const isOwnProfile = !id || id === user?.id;
  const profileUser = isOwnProfile ? user : mockUsers[id || ''];
  
  const [formData, setFormData] = useState({
    name: profileUser?.name || '',
    email: profileUser?.email || '',
    phone: profileUser?.phone || '',
    region: profileUser?.region || '',
    bio: profileUser?.bio || '',
  });

  useEffect(() => {
    if (isOwnProfile && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isOwnProfile]);

  if (isOwnProfile && !user) return null;
  if (!isOwnProfile && !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
    setIsEditing(false);
  };

  const handleKYCUpload = () => {
    toast({
      title: 'KYC Document Uploaded',
      description: 'Your verification documents have been submitted for review.',
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast({
          title: 'Avatar Updated',
          description: 'Your profile picture has been updated.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // If viewing someone else's profile, show public view
  if (!isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profileUser.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">{profileUser.name}</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                      <Badge variant="outline" className="capitalize">
                        {profileUser.role}
                      </Badge>
                      {profileUser.role === 'producer' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verified Producer
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-2">{profileUser.region}</p>
                  </div>
                  {isAuthenticated && (
                    <Button onClick={() => navigate('/chats')}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {profileUser.bio && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{profileUser.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profileUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profileUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{profileUser.region}</p>
                </div>
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
          <PageHeader title="My Profile" />

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile Header */}
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {user.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full cursor-pointer"
                          asChild
                        >
                          <div>
                            <Camera className="h-4 w-4" />
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </div>
                        </Button>
                      </label>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                        {user.role === 'producer' && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      placeholder={
                        user.role === 'producer'
                          ? 'Tell buyers about your farm and products...'
                          : 'Tell others about yourself...'
                      }
                    />
                  </div>
                  {isEditing && (
                    <Button onClick={handleSave} className="w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* KYC Section for Producers */}
              {user.role === 'producer' && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>KYC Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload your verification documents to become a verified producer and gain buyer trust.
                    </p>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload ID card, business license, or farm certification
                      </p>
                      <Button variant="outline" onClick={handleKYCUpload}>
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Log */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Profile updated</p>
                        <p className="text-sm text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Logged in from new device</p>
                        <p className="text-sm text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
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