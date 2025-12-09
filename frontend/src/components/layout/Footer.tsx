import { Link } from 'react-router-dom';
import { Globe, Facebook, Instagram, Twitter, Send, Heart, Shield,  Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/ethiotrust-logo.png';

export const Footer = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <footer className="border-t border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900/20 mt-20">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <img src={logo} alt="EthioTrust" className="h-12 w-12 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  EthioTrust
                </span>
                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium -mt-1">
                  Trusted Ethiopian Marketplace
                </span>
              </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Empowering Ethiopian producers and buyers through transparent,
              <span className="font-semibold text-amber-600 dark:text-amber-400"> blockchain-powered </span>
              commerce.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 text-amber-500" />
                <span>Secure Transactions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Verified Products</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Contact */}
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              {t('footer.paymentPartners')}
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Chapa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">ArifPay</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">+251 911 234 567</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">24/7 Customer Support</div>
            </div>
          </div>

          {/* Social & Theme */}
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              Connect With Us
            </h3>
            <div className="flex gap-4 mb-6">
              <a
                href="https://facebook.com/ethiotrust"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
              </a>
              <a
                href="https://instagram.com/ethiotrust"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-pink-600" />
              </a>
              <a
                href="https://twitter.com/ethiotrust"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300 group"
                aria-label="Twitter/X"
              >
                <Twitter className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-400" />
              </a>
              <a
                href="https://t.me/ethiotrust"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300 group"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
              </a>
            </div>

            <div className="flex gap-3">
              <Toggle
                pressed={theme === 'dark'}
                onPressedChange={toggleTheme}
                variant="outline"
                size="sm"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Toggle>
              <Toggle
                pressed={language === 'am'}
                onPressedChange={toggleLanguage}
                variant="outline"
                size="sm"
              >
                <Globe className="h-4 w-4 mr-2" />
                {language.toUpperCase()}
              </Toggle>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-amber-200 dark:border-amber-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                © 2024 EthioTrust Marketplace. All rights reserved.
                <span className="text-amber-600 dark:text-amber-400"> Powered by blockchain transparency.</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;