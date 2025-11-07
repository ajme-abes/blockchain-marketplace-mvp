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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

  const commonLinks = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { title: 'Chats', url: '/chats', icon: MessageSquare },
    { title: 'Profile', url: '/profile', icon: User },
    { title: 'Settings', url: '/settings', icon: Settings },
    { title: 'About Us', url: '/about', icon: Info },
  ];

  const producerLinks = [
    { title: 'My Products', url: '/my-products', icon: Package },
    { title: 'My Orders', url: '/my-orders', icon: ShoppingCart },
  ];

  const buyerLinks = [
    { title: 'My Orders', url: '/my-orders', icon: ShoppingCart },
  ];

  const adminLinks = [
    { title: 'Manage Users', url: '/admin/users', icon: Users },
    { title: 'Manage Products', url: '/admin/products', icon: Wrench },
    { title: 'Disputes', url: '/admin/disputes', icon: Scale },
  ];

  // New: transaction links (visible to authenticated users)
  const transactionLinks = [
    { title: 'Transaction History', url: '/producer/transactionhistory', icon: Package },
  ];

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
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
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

        {/* New Transactions group */}
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Transactions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {transactionLinks.map((item) => (
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

        {roleLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{user?.role === 'ADMIN' ? 'Admin' : 'My Activity'}</SidebarGroupLabel>
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
