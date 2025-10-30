import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, AlertCircle, DollarSign, TrendingUp, ShoppingCart, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const kpis = [
    { title: 'Total Users', value: '342', change: '+12%', icon: Users, color: 'text-primary' },
    { title: 'Verified Producers', value: '87', change: '+5%', icon: ShieldCheck, color: 'text-secondary' },
    { title: 'Active Listings', value: '1,234', change: '+18%', icon: Package, color: 'text-accent' },
    { title: 'Orders Today', value: '56', change: '+23%', icon: ShoppingCart, color: 'text-primary' },
    { title: 'Open Disputes', value: '3', change: '-2', icon: AlertCircle, color: 'text-destructive' },
    { title: 'Pending Payments', value: '12', change: '+4', icon: DollarSign, color: 'text-secondary' },
    { title: 'System Alerts', value: '2', change: '0', icon: AlertCircle, color: 'text-accent' },
    { title: 'Revenue (ETB)', value: '1.2M', change: '+15%', icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">Admin Dashboard</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome, Administrator</h2>
              <p className="text-muted-foreground">Monitor and manage the EthioTrust marketplace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {kpis.map((kpi, index) => (
                <Card key={index} className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </CardTitle>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpi.change} from last period
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'New user registered', user: 'Abebe Kebede', time: '5 min ago' },
                      { action: 'Product approved', user: 'Tigist Haile', time: '15 min ago' },
                      { action: 'Dispute resolved', user: 'Case #1234', time: '1 hour ago' },
                      { action: 'Payment verified', user: 'Order #5678', time: '2 hours ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.user}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Failed webhook callback</p>
                        <p className="text-sm text-muted-foreground">Payment gateway webhook failed for order #1234</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">IPFS pin expiring</p>
                        <p className="text-sm text-muted-foreground">3 CIDs need re-pinning within 7 days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;