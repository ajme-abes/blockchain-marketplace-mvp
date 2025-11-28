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
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Sun, Globe } from 'lucide-react';

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  // Core links for ALL roles
  const coreLinks = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Profile', url: '/profile', icon: User },
    { title: 'Settings', url: '/settings', icon: Settings },
    { title: 'About Us', url: '/about', icon: Info },
  ];

  // Role-specific additional common links
  const getRoleSpecificLinks = (role: string) => {
    switch (role) {
      case 'BUYER':
        return [
          { title: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
          { title: 'Chats', url: '/chats', icon: MessageSquare },
        ];
      case 'PRODUCER':
        return [
          { title: 'Chats', url: '/chats', icon: MessageSquare },
        ];
      case 'ADMIN':
        return [
          { title: 'System Monitor', url: '/admin/monitor', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const producerLinks = [
    { title: 'My Products', url: '/my-products', icon: Package },
    { title: 'Order Management', url: '/producer/orders', icon: ShoppingCart },
    { title: 'Customer Reviews', url: '/producer/reviews', icon: Star },
    { title: 'Transaction History', url: '/producer/transactionhistory', icon: History },
    { title: 'Sales Analytics', url: '/producer/analytics', icon: BarChart2 },
    { title: 'Store Settings', url: '/producer/store-settings', icon: Settings },
    { title: 'My Disputes', url: '/producer/disputes', icon: AlertTriangle },
  ];

  const buyerLinks = [
    { title: 'My Orders', url: '/my-orders', icon: ShoppingCart },
    { title: 'Purchase History', url: '/buyer/transactions', icon: History },
    { title: 'My Disputes', url: '/buyer/disputes', icon: AlertTriangle },
  ];

  const adminLinks = [
    { title: 'User Management', url: '/admin/users', icon: Users },
    { title: 'Product Management', url: '/admin/products', icon: Package },
    { title: 'Order Management', url: '/admin/orders', icon: ShoppingCart },
    { title: 'Producer Payouts', url: '/admin/payouts', icon: DollarSign },
    { title: 'Dispute Management', url: '/admin/disputes', icon: Scale },
    { title: 'System Analytics', url: '/admin/analytics', icon: TrendingUp },
    { title: 'Audit Logs', url: '/admin/logs', icon: FileText },
    { title: 'System Settings', url: '/admin/settings', icon: Settings },
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-smooth"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
              {user?.role === 'ADMIN' ? 'Admin Controls' :
                user?.role === 'PRODUCER' ? 'Business Tools' : 'My Activity'}
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
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex-1 transition-smooth"
          >
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs">{language.toUpperCase()}</span>
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={logout}
          className="w-full transition-smooth"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};