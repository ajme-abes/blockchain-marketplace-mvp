import { Link } from 'react-router-dom';
import { Moon, Sun, Globe, Facebook, Instagram, Twitter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/ethiotrust-logo.png';

export const Footer = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <footer className="border-t border-border bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <img src={logo} alt="EthioTrust" className="h-8 w-8" />
              <span className="gradient-hero bg-clip-text text-transparent">EthioTrust</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering Ethiopian producers and buyers through transparent, blockchain-powered commerce.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-smooth">Home</Link></li>
              <li><Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-smooth">Marketplace</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-smooth">About Us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-smooth">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.paymentPartners')}</h3>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-primary">Chapa</div>
              <div className="text-sm font-medium text-primary">ArifPay</div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              +251 911 234 567
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect With Us</h3>
            <div className="flex gap-3 mb-4">
              <a 
                href="https://facebook.com/ethiotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/ethiotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/ethiotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
                aria-label="Twitter/X"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://t.me/ethiotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="transition-smooth"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLanguage}
                className="transition-smooth"
              >
                <Globe className="h-4 w-4" />
                <span className="ml-1 text-xs">{language.toUpperCase()}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2024 EthioTrust Marketplace. All rights reserved. Powered by blockchain transparency.
        </div>
      </div>
    </footer>
  );
};
