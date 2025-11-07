import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  const { user } = useAuth();
  const { state: cartState } = useCart();

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <SidebarTrigger />
        <h1 className="text-xl font-bold ml-4">{title}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Notifications - For all authenticated users */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Notifications</h4>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Mark all as read
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto space-y-1">
                  <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent">
                    <div className="text-sm font-medium">New order received</div>
                    <div className="text-xs text-muted-foreground">You have a new order for Coffee Beans</div>
                    <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent">
                    <div className="text-sm font-medium">Payment received</div>
                    <div className="text-xs text-muted-foreground">Payment of 3,500 ETB has been received</div>
                    <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent">
                    <div className="text-sm font-medium">Product review</div>
                    <div className="text-xs text-muted-foreground">John Doe left a review on your product</div>
                    <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <Link to="/notifications" className="block">
                  <Button variant="ghost" className="w-full justify-center text-sm">
                    View all notifications
                  </Button>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Cart - Only for buyers */}
        {user && user.role === 'BUYER' && (
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartState.itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartState.itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

