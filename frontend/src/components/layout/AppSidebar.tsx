import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  Scale,
  Info,
  Star,
  BarChart2,
  History,
  AlertTriangle,
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
  Mail,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useDispute } from '@/contexts/DisputeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Moon, Sun, Globe } from 'lucide-react';

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useChat();
  const { activeDisputeCount } = useDispute();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  // Core links for ALL roles
  const coreLinks = [
    { title: 'sidebar.dashboard', url: '/dashboard', icon: Home },
    { title: 'sidebar.profile', url: '/profile', icon: User },
    { title: 'sidebar.settings', url: '/settings', icon: Settings },
    { title: 'sidebar.aboutUs', url: '/about', icon: Info },
  ];

  // Role-specific additional common links
  const getRoleSpecificLinks = (role: string) => {
    switch (role) {
      case 'BUYER':
        return [
          { title: 'sidebar.marketplace', url: '/marketplace', icon: ShoppingBag },
          { title: 'sidebar.chats', url: '/chats', icon: MessageSquare },
        ];
      case 'PRODUCER':
        return [
          { title: 'sidebar.chats', url: '/chats', icon: MessageSquare },
        ];
      case 'ADMIN':
        return [
          { title: 'sidebar.systemMonitor', url: '/admin/monitor', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const producerLinks = [
    { title: 'sidebar.producer.myProducts', url: '/my-products', icon: Package },
    { title: 'sidebar.producer.orderManagement', url: '/producer/orders', icon: ShoppingCart },
    { title: 'sidebar.producer.customerReviews', url: '/producer/reviews', icon: Star },
    { title: 'sidebar.producer.transactionHistory', url: '/producer/transactionhistory', icon: History },
    { title: 'sidebar.producer.salesAnalytics', url: '/producer/analytics', icon: BarChart2 },
    { title: 'sidebar.producer.storeSettings', url: '/producer/store-settings', icon: Settings },
    { title: 'sidebar.producer.myDisputes', url: '/producer/disputes', icon: AlertTriangle },
  ];

  const buyerLinks = [
    { title: 'sidebar.buyer.myOrders', url: '/my-orders', icon: ShoppingCart },
    { title: 'sidebar.buyer.purchaseHistory', url: '/buyer/transactions', icon: History },
    { title: 'sidebar.buyer.myDisputes', url: '/buyer/disputes', icon: AlertTriangle },
  ];

  const adminLinks = [
    { title: 'sidebar.admin.userManagement', url: '/admin/users', icon: Users },
    { title: 'sidebar.admin.productManagement', url: '/admin/products', icon: Package },
    { title: 'sidebar.admin.orderManagement', url: '/admin/orders', icon: ShoppingCart },
    { title: 'sidebar.admin.producerPayouts', url: '/admin/payouts', icon: DollarSign },
    { title: 'sidebar.admin.disputeManagement', url: '/admin/disputes', icon: Scale },
    { title: 'sidebar.admin.testimonials', url: '/admin/testimonials', icon: MessageSquare },
    { title: 'sidebar.admin.contactMessages', url: '/admin/contact-messages', icon: Mail },
    { title: 'sidebar.admin.systemAnalytics', url: '/admin/analytics', icon: TrendingUp },
    { title: 'sidebar.admin.auditLogs', url: '/admin/logs', icon: FileText },
    { title: 'sidebar.admin.systemSettings', url: '/admin/settings', icon: Settings },
  ];

  const commonLinks = [...coreLinks, ...getRoleSpecificLinks(user?.role || '')];

  let roleLinks: typeof commonLinks = [];
  if (user?.role === 'PRODUCER') roleLinks = producerLinks;
  if (user?.role === 'BUYER') roleLinks = buyerLinks;
  if (user?.role === 'ADMIN') roleLinks = adminLinks;

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={user?.avatarUrl}
              alt={user?.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-smooth"
                  >
                    <Link to={item.url} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.title)}</span>
                      </div>
                      {item.url === '/chats' && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {roleLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {user?.role === 'ADMIN' ? t('sidebar.admin.title') :
                user?.role === 'PRODUCER' ? t('sidebar.producer.title') : t('sidebar.buyer.title')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {roleLinks.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className="transition-smooth"
                    >
                      <Link to={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{t(item.title)}</span>
                        </div>
                        {(item.url === '/buyer/disputes' || item.url === '/producer/disputes' || item.url === '/admin/disputes') && activeDisputeCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                            {activeDisputeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex-1 transition-smooth"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <LanguageSelector />
        </div>
        {/* Show My Messages only for Buyers and Producers, not Admin */}
        {user?.role !== 'ADMIN' && (
          <Link to="/my-messages" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full transition-smooth relative"
            >
              <Mail className="h-4 w-4 mr-2" />
              My Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={logout}
          className="w-full transition-smooth"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('auth.logout')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};