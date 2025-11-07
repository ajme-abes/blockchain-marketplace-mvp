// src/pages/buyer/BuyerDashboard.tsx
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BuyerDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { title: 'Total Orders', value: '8', icon: ShoppingCart, color: 'text-primary' },
    { title: 'Pending', value: '2', icon: Package, color: 'text-secondary' },
    { title: 'Total Spent', value: '12,540 ETB', icon: DollarSign, color: 'text-accent' },
    { title: 'Favorites', value: '15', icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="Buyer Dashboard" />

          <main className="flex-1 p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-muted-foreground">
                Here's what's happening with your orders today.
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
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your recent orders will be displayed here.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default BuyerDashboard;