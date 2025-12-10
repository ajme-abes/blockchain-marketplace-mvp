import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, TrendingUp, Heart, Loader2, Mail } from 'lucide-react';
import api from '@/services/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
}

const About = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoadingTeam(true);
      const response = await api.request('/team/active');

      if (response.status === 'success') {
        setTeam(response.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Helper function to ensure URL has proper protocol
  const ensureHttps = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    // Trim whitespace
    url = url.trim();

    // If already has protocol, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Add https:// if missing
    return `https://${url}`;
  };

  const content = (
    <main className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
          About Us
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
          About EthioTrust
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          EthioTrust is revolutionizing Ethiopian commerce by connecting producers directly
          with buyers through blockchain-powered transparency. We believe in fair trade, local empowerment,
          and leveraging technology to create a more equitable marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <Card className="shadow-card text-center">
          <CardContent className="p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Blockchain Verified</h3>
            <p className="text-sm text-muted-foreground">
              Every transaction recorded on the blockchain for complete transparency
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card text-center">
          <CardContent className="p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Direct Connection</h3>
            <p className="text-sm text-muted-foreground">
              Connect directly with producers, no middlemen taking unfair cuts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card text-center">
          <CardContent className="p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fair Prices</h3>
            <p className="text-sm text-muted-foreground">
              Producers get fair compensation, buyers get quality products
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card text-center">
          <CardContent className="p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Local First</h3>
            <p className="text-sm text-muted-foreground">
              Supporting Ethiopian communities and local businesses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mission Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 bg-accent/5 border-accent/20 text-accent">
            Our Mission
          </Badge>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Empowering Ethiopian Commerce
          </h2>
        </div>
        <Card className="shadow-card max-w-4xl mx-auto border-primary/10 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-8">
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Our mission is to empower Ethiopian producers by providing them with a transparent,
              fair, and accessible platform to sell their products directly to buyers. We leverage
              blockchain technology to ensure every transaction is verified and trustworthy.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              By eliminating middlemen and providing integrated payment solutions through Chapa
              and ArifPay, we ensure producers receive fair compensation while buyers get authentic,
              high-quality Ethiopian products.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Section */}
      {team.length > 0 && (
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              Our Team
            </Badge>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Meet Our Team
            </h2>
          </div>

          {loadingTeam ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card
                  key={member.id}
                  className="group shadow-card hover-lift transition-smooth border-primary/10 bg-gradient-to-br from-background to-primary/5 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    {/* Avatar with gradient border */}
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <Avatar className="relative w-28 h-28 border-4 border-background shadow-lg group-hover:scale-105 transition-transform">
                        <AvatarImage src={member.imageUrl} alt={member.name} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-3xl">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Name and Role */}
                    <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">
                      {member.name}
                    </h3>
                    <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
                      {member.role}
                    </Badge>

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {(member.linkedin || member.twitter || member.email) && (
                      <div className="flex justify-center gap-2 pt-4 border-t border-primary/10">
                        {member.linkedin && (
                          <a
                            href={ensureHttps(member.linkedin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="LinkedIn Profile"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        )}
                        {member.twitter && (
                          <a
                            href={ensureHttps(member.twitter)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Twitter/X Profile"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Section */}
      <div className="max-w-2xl mx-auto text-center">
        <Badge variant="outline" className="mb-4 bg-accent/5 border-accent/20 text-accent">
          Contact Us
        </Badge>
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Get in Touch
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          Have questions or want to learn more about EthioTrust?
        </p>
        <Card className="shadow-card border-primary/10 bg-gradient-to-br from-background to-accent/5">
          <CardContent className="p-6">
            <div className="space-y-3 text-primary font-semibold">
              <p className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5" />
                info@ethiotrust.et
              </p>
              <p>📞 +251910816201</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
};

export default About;
