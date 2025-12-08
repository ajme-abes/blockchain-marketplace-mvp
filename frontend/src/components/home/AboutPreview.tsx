import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, TrendingUp, Target, Sparkles, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

interface AboutStats {
  activeProducers: number;
  totalTransactions: number;
  satisfactionRate: number;
  regionsServed: number;
}

export const AboutPreview = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AboutStats>({
    activeProducers: 500,
    totalTransactions: 10000,
    satisfactionRate: 98,
    regionsServed: 50
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getAboutStats();
        if (response.status === 'success' && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching about stats:', error);
        // Keep default values on error
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Blockchain Verified",
      description: "Every transaction is recorded on the blockchain for complete transparency and security",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Users,
      title: "Direct Connection",
      description: "Connect directly with verified producers, eliminating middlemen and ensuring authenticity",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      icon: TrendingUp,
      title: "Fair Prices",
      description: "Producers get fair compensation while buyers get quality products at competitive prices",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      icon: Target,
      title: "Community Focused",
      description: "Building sustainable livelihoods and empowering Ethiopian communities nationwide",
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  const benefits = [
    "Transparent blockchain-verified transactions",
    "Direct producer-to-buyer connections",
    "Secure payment processing",
    "Quality assurance and verification",
    "Fair trade practices",
    "Community empowerment"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-full mb-4 shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">About EthioTrust</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [paint-order:stroke_fill]" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Empowering Ethiopian Commerce
            </span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            A revolutionary blockchain-powered marketplace connecting Ethiopian producers directly with buyers, 
            ensuring transparency, fairness, and community growth
          </p>
        </div>

        {/* Features Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-2 border-border hover:border-primary/50 shadow-card hover:shadow-card-hover transition-all duration-500 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Card className="border-2 border-primary/20 shadow-xl gradient-card">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                    <Zap className="h-3 w-3 mr-1" />
                    Platform Benefits
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                    Why Choose EthioTrust?
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    We're more than just a marketplace. We're building a sustainable ecosystem 
                    that empowers Ethiopian producers and ensures buyers get authentic, quality products.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/about">
                      <Button variant="default" size="lg" className="gradient-primary shadow-glow group">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="outline" size="lg">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${500 + index * 50}ms` }}
                    >
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section - Enhanced with Animations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <Card className="text-center p-6 border-2 border-border hover:border-primary/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group">
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform">
                {stats.activeProducers}+
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Active Producers
              </div>
              <div className="mt-2 h-1 w-12 mx-auto bg-gradient-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 border-border hover:border-secondary/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group">
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform">
                {stats.totalTransactions >= 1000
                  ? `${Math.floor(stats.totalTransactions / 1000)}K+`
                  : `${stats.totalTransactions}+`}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Transactions
              </div>
              <div className="mt-2 h-1 w-12 mx-auto bg-gradient-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 border-border hover:border-success/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group">
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform">
                {stats.satisfactionRate}%
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Satisfaction Rate
              </div>
              <div className="mt-2 h-1 w-12 mx-auto bg-success rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 border-border hover:border-accent/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group">
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform">
                {stats.regionsServed}+
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Regions Served
              </div>
              <div className="mt-2 h-1 w-12 mx-auto bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};