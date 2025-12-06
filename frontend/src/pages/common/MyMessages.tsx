import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, MessageSquare, CheckCircle, Clock, Archive, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContactMessage {
    id: string;
    subject: string;
    message: string;
    status: 'UNREAD' | 'READ' | 'RESPONDED' | 'ARCHIVED';
    adminNotes: string | null;
    respondedAt: string | null;
    createdAt: string;
}

export default function MyMessages() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    useEffect(() => {
        fetchMyMessages();
    }, []);

    const fetchMyMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact/my-messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                setMessages(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            UNREAD: { icon: Clock, label: 'Pending', variant: 'secondary' as const },
            READ: { icon: Mail, label: 'Read', variant: 'default' as const },
            RESPONDED: { icon: CheckCircle, label: 'Responded', variant: 'default' as const, className: 'bg-green-500 text-white' },
            ARCHIVED: { icon: Archive, label: 'Archived', variant: 'secondary' as const }
        };

        const { icon: Icon, label, variant, className } = config[status as keyof typeof config] || config.UNREAD;

        return (
            <Badge variant={variant} className={className}>
                <Icon className="h-3 w-3 mr-1" />
                {label}
            </Badge>
        );
    };

    const respondedCount = messages.filter(m => m.status === 'RESPONDED').length;
    const pendingCount = messages.filter(m => m.status === 'UNREAD' || m.status === 'READ').length;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader
                        title="My Messages"
                        action={
                            <Button onClick={() => window.location.href = '/contact'}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send New Message
                            </Button>
                        }
                    />

                    <main className="flex-1 p-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Messages</p>
                                            <p className="text-2xl font-bold">{messages.length}</p>
                                        </div>
                                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pending</p>
                                            <p className="text-2xl font-bold">{pendingCount}</p>
                                        </div>
                                        <Clock className="h-8 w-8 text-yellow-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Responded</p>
                                            <p className="text-2xl font-bold">{respondedCount}</p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Messages List */}
                        {!loading && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {messages.map((message) => (
                                    <Card
                                        key={message.id}
                                        className={`hover:shadow-lg transition-shadow cursor-pointer ${message.status === 'RESPONDED' ? 'border-green-500/50' : ''
                                            }`}
                                        onClick={() => setSelectedMessage(message)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{message.subject}</CardTitle>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Sent: {new Date(message.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {getStatusBadge(message.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {message.message}
                                            </p>

                                            {message.status === 'RESPONDED' && message.adminNotes && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm font-semibold text-green-600">Admin Response</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {message.adminNotes}
                                                    </p>
                                                </div>
                                            )}

                                            {message.status === 'RESPONDED' && message.respondedAt && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Responded: {new Date(message.respondedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}

                                {messages.length === 0 && (
                                    <Card className="col-span-2">
                                        <CardContent className="p-12 text-center">
                                            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground mb-4">No messages yet</p>
                                            <Button onClick={() => window.location.href = '/contact'}>
                                                Send a Message
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Message Detail Modal */}
                        {selectedMessage && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle>{selectedMessage.subject}</CardTitle>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Sent: {new Date(selectedMessage.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(selectedMessage.status)}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedMessage(null)}
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Your Message:</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                                                {selectedMessage.message}
                                            </p>
                                        </div>

                                        {selectedMessage.status === 'RESPONDED' && selectedMessage.adminNotes && (
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <h4 className="font-semibold text-green-600">Admin Response</h4>
                                                </div>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {selectedMessage.adminNotes}
                                                </p>
                                                {selectedMessage.respondedAt && (
                                                    <p className="text-xs text-muted-foreground mt-3">
                                                        Responded on: {new Date(selectedMessage.respondedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {(selectedMessage.status === 'UNREAD' || selectedMessage.status === 'READ') && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-5 w-5 text-yellow-600" />
                                                    <p className="text-sm text-yellow-600 font-medium">
                                                        Your message is being reviewed. We'll respond soon!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </main>

                    {/* Floating Action Button */}
                    <Link to="/contact">
                        <Button
                            size="lg"
                            className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all h-14 w-14 p-0 z-50"
                            title="Send New Message"
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </Link>
                </div>
            </div>
        </SidebarProvider>
    );
}
