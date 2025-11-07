import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, Shield, Sparkles, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/ethiotrust-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-200 dark:border-amber-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src={logo} 
                alt="EthioTrust" 
                className="h-12 w-12 relative z-10 transform group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                EthioTrust
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium -mt-1 opacity-90">
                Trusted Ethiopian Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              to="/" 
              className="relative text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group py-2"
            >
              {t('nav.home')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/marketplace" 
              className="relative text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group py-2"
            >
              {t('nav.marketplace')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/contact" 
              className="relative text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group py-2"
            >
              {t('nav.contact')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Toggle
              pressed={theme === 'dark'}
              onPressedChange={toggleTheme}
              className="hidden md:flex items-center gap-2"
              variant="outline"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Toggle>

            {/* Language Toggle */}
            <Toggle
              pressed={language === 'am'}
              onPressedChange={toggleLanguage}
              className="hidden md:flex items-center gap-2"
              variant="outline"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-semibold">{language.toUpperCase()}</span>
            </Toggle>
            
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-all"
                  >
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 font-semibold"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/dashboard" className="hidden md:inline-block">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 font-semibold"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Menu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] border-l border-amber-200 dark:border-amber-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                {/* Mobile Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-amber-200 dark:border-amber-800">
                  <img 
                    src={logo} 
                    alt="EthioTrust" 
                    className="h-10 w-10" 
                  />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      EthioTrust
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Trusted Ethiopian Marketplace
                    </span>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-1 mt-6">
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-xl p-3 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    {t('nav.home')}
                  </Link>
                  <Link 
                    to="/marketplace" 
                    className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-xl p-3 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    {t('nav.marketplace')}
                  </Link>
                  <Link 
                    to="/contact" 
                    className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-xl p-3 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    {t('nav.contact')}
                  </Link>
                  
                  {/* Mobile Actions */}
                  <div className="border-t border-amber-200 dark:border-amber-800 pt-6 mt-4 space-y-3">
                    <div className="flex gap-2">
                      <Toggle
                        pressed={theme === 'dark'}
                        onPressedChange={toggleTheme}
                        className="flex-1 justify-center"
                        variant="outline"
                      >
                        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      </Toggle>
                      <Toggle
                        pressed={language === 'am'}
                        onPressedChange={toggleLanguage}
                        className="flex-1 justify-center"
                        variant="outline"
                      >
                        <Globe className="h-4 w-4" />
                      </Toggle>
                    </div>
                    
                    {!isAuthenticated ? (
                      <div className="space-y-2">
                        <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all font-semibold"
                          >
                            {t('nav.login')}
                          </Button>
                        </Link>
                        <Link to="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 font-semibold"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t('nav.register')}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Link to="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 font-semibold"
                        >
                          <Shield className="h-4 w-4 mr-2" />
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

export default Navbar;