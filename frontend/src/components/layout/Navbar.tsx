import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/ethiotrust-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src={logo} alt="EthioTrust" className="h-8 w-8" />
            <span className="gradient-hero bg-clip-text text-transparent">EthioTrust</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-smooth">
              {t('nav.home')}
            </Link>
            <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-smooth">
              {t('nav.marketplace')}
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-smooth">
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden md:flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-semibold">{language.toUpperCase()}</span>
            </Button>
            
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden md:inline-block">
                  <Button variant="ghost" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register" className="hidden md:inline-block">
                  <Button variant="hero" size="sm">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="hidden md:inline-block">
                <Button variant="default" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/" 
                    className="text-lg font-medium hover:text-primary transition-smooth py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.home')}
                  </Link>
                  <Link 
                    to="/marketplace" 
                    className="text-lg font-medium hover:text-primary transition-smooth py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.marketplace')}
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-lg font-medium hover:text-primary transition-smooth py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.contact')}
                  </Link>
                  
                  <div className="border-t pt-4 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLanguage}
                      className="w-full mb-3"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Switch to አማርኛ' : 'Switch to English'}
                    </Button>
                    
                    {!isAuthenticated ? (
                      <>
                        <Link to="/login" className="block mb-2" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full">
                            {t('nav.login')}
                          </Button>
                        </Link>
                        <Link to="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="hero" size="sm" className="w-full">
                            {t('nav.register')}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link to="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="default" size="sm" className="w-full">
                          Dashboard
                        </Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
