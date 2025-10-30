import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, TrendingUp, Heart } from 'lucide-react';

const About = () => {
  const team = [
    { name: 'Abebe Tadesse', role: 'Founder & CEO', image: 'https://i.pravatar.cc/150?img=11' },
    { name: 'Meron Alemu', role: 'CTO', image: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Daniel Bekele', role: 'Head of Operations', image: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Sara Tesfaye', role: 'Community Manager', image: 'https://i.pravatar.cc/150?img=9' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About EthioTrust</h1>
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

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission</h2>
          <Card className="shadow-card max-w-4xl mx-auto">
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

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="shadow-card text-center">
                <CardContent className="p-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Have questions or want to learn more about EthioTrust?
          </p>
          <div className="text-primary font-semibold">
            <p>Email: info@ethiotrust.et</p>
            <p>Phone: +251 911 234 567</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
