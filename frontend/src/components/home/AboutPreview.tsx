import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const AboutPreview = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('about.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            We connect Ethiopian producers directly with buyers through transparent, blockchain-powered
            transactions. Our mission is to create a fair marketplace that empowers local communities
            and ensures every transaction is verified and trustworthy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Blockchain Verified</h3>
            <p className="text-muted-foreground">
              Every transaction is recorded on the blockchain for complete transparency
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Direct Connection</h3>
            <p className="text-muted-foreground">
              Connect directly with producers, no middlemen taking unfair cuts
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fair Prices</h3>
            <p className="text-muted-foreground">
              Producers get fair compensation, buyers get quality products
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/about">
            <Button variant="outline" size="lg">
              Learn More About Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
