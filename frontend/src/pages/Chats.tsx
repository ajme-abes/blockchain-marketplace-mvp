import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Chats = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const mockChats = [
    { id: 1, name: 'Alemayehu Bekele', lastMessage: 'Coffee is ready for shipment', time: '2m ago' },
    { id: 2, name: 'Tigist Haile', lastMessage: 'Thank you for your order!', time: '1h ago' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">Messages</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
              <Card className="shadow-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {mockChats.map(chat => (
                      <div key={chat.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-smooth">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{chat.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{chat.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{chat.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card lg:col-span-2">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>Alemayehu Bekele</CardTitle>
                      <p className="text-sm text-muted-foreground">Coffee Producer</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="flex gap-3">
                      <Avatar className="flex-shrink-0">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                        <p className="text-sm">Hello! I'm interested in your Yirgacheffe coffee.</p>
                        <span className="text-xs text-muted-foreground">10:30 AM</span>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
                        <p className="text-sm">Great! I can prepare 50kg for you. When do you need it?</p>
                        <span className="text-xs opacity-80">10:32 AM</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input placeholder="Type your message..." className="flex-1" />
                      <Button variant="hero">
                        <Send className="h-4 w-4" />
                      </Button>
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

export default Chats;
