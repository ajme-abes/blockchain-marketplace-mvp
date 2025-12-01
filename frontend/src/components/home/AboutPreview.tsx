import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, TrendingUp, Target } from 'lucide-react';
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

        {/* Stats Section - Real Data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats.activeProducers}+
            </div>
            <div className="text-sm text-muted-foreground">
              Active Producers
            </div>
          </div>

          <div className="text-center p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats.totalTransactions >= 1000
                ? `${Math.floor(stats.totalTransactions / 1000)}K+`
                : `${stats.totalTransactions}+`}
            </div>
            <div className="text-sm text-muted-foreground">
              Transactions
            </div>
          </div>

          <div className="text-center p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats.satisfactionRate}%
            </div>
            <div className="text-sm text-muted-foreground">
              Satisfaction
            </div>
          </div>

          <div className="text-center p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="text-2xl font-bold text-primary mb-1">
              {stats.regionsServed}+
            </div>
            <div className="text-sm text-muted-foreground">
              Regions
            </div>
          </div>
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