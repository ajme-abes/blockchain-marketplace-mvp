// src/pages/producer/ProducerOrders.tsx
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Truck, CheckCircle, MessageCircle, AlertTriangle, Eye } from 'lucide-react';

const ProducerOrders = () => {
  const [activeTab, setActiveTab] = useState('new');

  const orders = {
    new: [
      {
        id: 'ORD-001',
        buyerName: 'John Doe',
        product: 'Premium Coffee Beans',
        quantity: 10,
        total: 3500,
        orderDate: '2024-01-15',
        status: 'pending'
      }
    ],
    shipping: [
      {
        id: 'ORD-002',
        buyerName: 'Sarah Smith',
        product: 'Organic Honey',
        quantity: 5,
        total: 1250,
        orderDate: '2024-01-14',
        status: 'shipped'
      }
    ],
    completed: [
      {
        id: 'ORD-003',
        buyerName: 'Mike Johnson',
        product: 'Fresh Teff',
        quantity: 20,
        total: 2200,
        orderDate: '2024-01-13',
        status: 'delivered'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'shipped': return 'bg-blue-500/10 text-blue-600';
      case 'delivered': return 'bg-green-500/10 text-green-600';
      case 'cancelled': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const currentOrders = orders[activeTab as keyof typeof orders];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="Order Management" />

          <main className="flex-1 p-6">
            {/* Order Tabs */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex space-x-1">
                  {[
                    { key: 'new', label: 'New Orders', icon: Package, count: orders.new.length },
                    { key: 'shipping', label: 'To Ship', icon: Truck, count: orders.shipping.length },
                    { key: 'completed', label: 'Completed', icon: CheckCircle, count: orders.completed.length },
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "ghost"}
                      className="flex-1 justify-start"
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                      <Badge variant="secondary" className="ml-2">
                        {tab.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'new' && 'New Orders'}
                  {activeTab === 'shipping' && 'Orders to Ship'}
                  {activeTab === 'completed' && 'Completed Orders'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.buyerName}</TableCell>
                        <TableCell>{order.product}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.total} ETB</TableCell>
                        <TableCell>{order.orderDate}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            {activeTab === 'new' && (
                              <Button size="sm">
                                <Truck className="h-3 w-3 mr-1" />
                                Ship
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {currentOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found in this category
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProducerOrders;