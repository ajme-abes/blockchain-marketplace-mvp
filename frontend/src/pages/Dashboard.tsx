import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const stats = user.role === 'producer' 
    ? [
        { title: 'Total Listings', value: '12', icon: Package, color: 'text-primary' },
        { title: 'Pending Orders', value: '5', icon: ShoppingCart, color: 'text-secondary' },
        { title: 'Monthly Earnings', value: '45,230 ETB', icon: DollarSign, color: 'text-accent' },
        { title: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-primary' },
      ]
    : user.role === 'buyer'
    ? [
        { title: 'Total Orders', value: '8', icon: ShoppingCart, color: 'text-primary' },
        { title: 'Pending', value: '2', icon: Package, color: 'text-secondary' },
        { title: 'Total Spent', value: '12,540 ETB', icon: DollarSign, color: 'text-accent' },
        { title: 'Favorites', value: '15', icon: TrendingUp, color: 'text-primary' },
      ]
    : [
        { title: 'Total Users', value: '342', icon: Package, color: 'text-primary' },
        { title: 'Active Producers', value: '87', icon: ShoppingCart, color: 'text-secondary' },
        { title: 'Open Disputes', value: '3', icon: DollarSign, color: 'text-accent' },
        { title: 'Growth', value: '+18%', icon: TrendingUp, color: 'text-primary' },
      ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">
              {user.role === 'producer' ? 'Producer Dashboard' :
               user.role === 'buyer' ? 'Buyer Dashboard' :
               'Admin Dashboard'}
            </h1>
          </header>

          <main className="flex-1 p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.name}!
              </h2>
              <p className="text-muted-foreground">
                Here's what's happening with your account today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your recent activity will be displayed here.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
