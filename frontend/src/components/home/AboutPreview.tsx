import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, TrendingUp, Target, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const AboutPreview = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: "Blockchain Verified",
      description: "Every transaction is recorded on the blockchain for complete transparency"
    },
    {
      icon: Users,
      title: "Direct Connection", 
      description: "Connect directly with producers, eliminating middlemen"
    },
    {
      icon: TrendingUp,
      title: "Fair Prices",
      description: "Producers get fair compensation, buyers get quality products"
    },
    {
      icon: Target,
      title: "Community Focused",
      description: "Building sustainable livelihoods for Ethiopian communities"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            About Our Platform
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connecting Ethiopian producers directly with buyers through transparent, fair trading
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 border border-border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { number: "500+", label: "Active Producers" },
            { number: "10K+", label: "Transactions" },
            { number: "98%", label: "Satisfaction" },
            { number: "50+", label: "Regions" }
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/about">
              <Button variant="default" className="px-6">
                Learn More
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" className="px-6">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};