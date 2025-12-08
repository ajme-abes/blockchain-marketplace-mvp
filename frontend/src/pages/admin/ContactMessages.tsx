import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, Eye, Trash2, Check, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'UNREAD' | 'READ' | 'RESPONDED' | 'ARCHIVED';
    user: any;
    adminNotes: string | null;
    respondedAt: string | null;
    createdAt: string;
}

export default function ContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchMessages();
    }, [filter]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const filterParam = filter !== 'all' ? `?status=${filter.toUpperCase()}` : '';
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact${filterParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                setMessages(data.data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string, notes?: string) => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, adminNotes: notes })
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success('Status updated');
                fetchMessages();
                setSelectedMessage(null);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success('Message deleted');
                fetchMessages();
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Failed to delete message');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            UNREAD: { variant: 'destructive', label: 'Unread' },
            READ: { variant: 'default', label: 'Read' },
            RESPONDED: { variant: 'default', label: 'Responded', className: 'bg-green-500' },
            ARCHIVED: { variant: 'secondary', label: 'Archived' }
        };

        const config = variants[status] || variants.UNREAD;
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    const unreadCount = messages.filter(m => m.status === 'UNREAD').length;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader title="Contact Messages" />

                    <main className="flex-1 p-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total</p>
                                            <p className="text-2xl font-bold">{messages.length}</p>
                                        </div>
                                        <Mail className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Unread</p>
                                            <p className="text-2xl font-bold">{unreadCount}</p>
                                        </div>
                                        <Badge variant="destructive" className="text-lg px-3 py-1">
                                            {unreadCount}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Responded</p>
                                            <p className="text-2xl font-bold">
                                                {messages.filter(m => m.status === 'RESPONDED').length}
                                            </p>
                                        </div>
                                        <Check className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Archived</p>
                                            <p className="text-2xl font-bold">
                                                {messages.filter(m => m.status === 'ARCHIVED').length}
                                            </p>
                                        </div>
                                        <Archive className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 mb-6">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'default' : 'outline'}
                                onClick={() => setFilter('unread')}
                            >
                                Unread ({unreadCount})
                            </Button>
                            <Button
                                variant={filter === 'read' ? 'default' : 'outline'}
                                onClick={() => setFilter('read')}
                            >
                                Read
                            </Button>
                            <Button
                                variant={filter === 'responded' ? 'default' : 'outline'}
                                onClick={() => setFilter('responded')}
                            >
                                Responded
                            </Button>
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
                                    <Card key={message.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{message.subject}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-sm text-muted-foreground">{message.name}</p>
                                                        <span className="text-muted-foreground">•</span>
                                                        <p className="text-sm text-muted-foreground">{message.email}</p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(message.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                                {message.message}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                <span>{new Date(message.createdAt).toLocaleString()}</span>
                                                {message.user && (
                                                    <Badge variant="outline">Registered User</Badge>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedMessage(message)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>

                                                {message.status === 'UNREAD' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => updateStatus(message.id, 'READ')}
                                                    >
                                                        Mark Read
                                                    </Button>
                                                )}

                                                {message.status !== 'RESPONDED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-green-500 hover:bg-green-600"
                                                        onClick={() => {
                                                            setSelectedMessage(message);
                                                            setAdminNotes('');
                                                        }}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Write Response
                                                    </Button>
                                                )}

                                                {message.status === 'RESPONDED' && message.adminNotes && (
                                                    <Badge variant="default" className="bg-green-500">
                                                        ✓ Responded
                                                    </Badge>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => deleteMessage(message.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {messages.length === 0 && (
                                    <Card className="col-span-2">
                                        <CardContent className="p-12 text-center">
                                            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No messages found</p>
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
                                            <div>
                                                <CardTitle>{selectedMessage.subject}</CardTitle>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    From: {selectedMessage.name} ({selectedMessage.email})
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedMessage(null);
                                                    setAdminNotes('');
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Message:</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {selectedMessage.message}
                                            </p>
                                        </div>

                                        {selectedMessage.adminNotes && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Admin Notes:</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedMessage.adminNotes}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Write Your Response: <span className="text-red-500">*</span>
                                            </h4>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                This response will be visible to the user
                                            </p>
                                            <Textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Type your response to the user here... (Required)"
                                                rows={6}
                                                className="border-primary/50"
                                            />
                                            {adminNotes.trim() === '' && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    Please write a response before marking as responded
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    if (adminNotes.trim() === '') {
                                                        toast.error('Please write a response before marking as responded');
                                                        return;
                                                    }
                                                    updateStatus(selectedMessage.id, 'RESPONDED', adminNotes);
                                                }}
                                                className="bg-green-500 hover:bg-green-600"
                                                disabled={adminNotes.trim() === ''}
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Send Response & Mark as Responded
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => updateStatus(selectedMessage.id, 'ARCHIVED', adminNotes)}
                                            >
                                                <Archive className="h-4 w-4 mr-2" />
                                                Archive
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
