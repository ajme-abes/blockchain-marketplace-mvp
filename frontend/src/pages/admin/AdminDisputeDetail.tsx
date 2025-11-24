// src/pages/admin/AdminDisputeDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft,
    FileText,
    MessageSquare,
    User,
    Download,
    Eye,
    Send,
    Calendar,
    Shield,
    DollarSign,
    Archive
} from 'lucide-react';
import { disputeService, Dispute, DisputeEvidence, DisputeMessage } from '@/services/disputeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminDisputeDetail = () => {
    const { disputeId } = useParams<{ disputeId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
    const [messages, setMessages] = useState<DisputeMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [sendingInternalNote, setSendingInternalNote] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'chat' | 'resolution'>('overview');
    const [showResolutionPanel, setShowResolutionPanel] = useState(false);
    const [resolutionData, setResolutionData] = useState({
        type: 'RESOLVED',
        refundAmount: '',
        resolutionNote: '',
        penalty: ''
    });

    useEffect(() => {
        if (disputeId) {
            fetchDisputeDetails();
        }
    }, [disputeId]);

    const fetchDisputeDetails = async () => {
        try {
            setLoading(true);
            const [disputeResult, evidenceResult, messagesResult] = await Promise.all([
                disputeService.getDisputeDetails(disputeId!),
                disputeService.getDisputeEvidence(disputeId!),
                disputeService.getDisputeMessages(disputeId!)
            ]);

            if (disputeResult.status === 'success' && disputeResult.data) {
                setDispute(disputeResult.data);
            }
            if (evidenceResult.status === 'success' && evidenceResult.data) {
                setEvidence(evidenceResult.data);
            }
            if (messagesResult.status === 'success' && messagesResult.data) {
                setMessages(messagesResult.data);
            }

        } catch (error: any) {
            console.error('Failed to fetch dispute details:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to load dispute details",
                variant: "destructive",
            });
            navigate('/admin/disputes');
        } finally {
            setLoading(false);
        }
    };

    // ADMIN: Send public message to both parties
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);
            const result = await disputeService.addMessage(disputeId!, newMessage.trim());

            if (result.status === 'success') {
                setNewMessage('');
                await fetchDisputeDetails();
                toast({
                    title: "Message Sent",
                    description: "Your message has been sent to both parties",
                });
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to send message",
                variant: "destructive",
            });
        } finally {
            setSendingMessage(false);
        }
    };

    // ADMIN: Send internal note (only visible to admins)
    const handleSendInternalNote = async () => {
        if (!internalNote.trim()) return;

        try {
            setSendingInternalNote(true);
            const result = await disputeService.addMessage(
                disputeId!,
                internalNote.trim(),
                'INTERNAL_NOTE',
                true
            );

            if (result.status === 'success') {
                setInternalNote('');
                await fetchDisputeDetails();
                toast({
                    title: "Internal Note Added",
                    description: "Note saved for admin team",
                });
            } else {
                throw new Error(result.message || 'Failed to add internal note');
            }
        } catch (error: any) {
            console.error('Failed to add internal note:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to add internal note",
                variant: "destructive",
            });
        } finally {
            setSendingInternalNote(false);
        }
    };

    // ADMIN: Force resolution
    const handleForceResolution = async () => {
        try {
            const result = await disputeService.updateDisputeStatus(
                disputeId!,
                resolutionData.type,
                resolutionData.resolutionNote,
                resolutionData.refundAmount ? parseFloat(resolutionData.refundAmount) : undefined
            );

            if (result.status === 'success') {
                toast({
                    title: "Dispute Resolved",
                    description: `Dispute has been ${resolutionData.type.toLowerCase()} by admin`,
                });
                setShowResolutionPanel(false);
                setResolutionData({
                    type: 'RESOLVED',
                    refundAmount: '',
                    resolutionNote: '',
                    penalty: ''
                });
                await fetchDisputeDetails();
            } else {
                throw new Error(result.message || 'Failed to resolve dispute');
            }
        } catch (error: any) {
            console.error('Failed to resolve dispute:', error);
            toast({
                title: "Resolution Failed",
                description: error.message || "Failed to resolve dispute",
                variant: "destructive",
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-yellow-500 text-white';
            case 'UNDER_REVIEW': return 'bg-blue-500 text-white';
            case 'RESOLVED': return 'bg-green-500 text-white';
            case 'REFUNDED': return 'bg-green-500 text-white';
            case 'CANCELLED': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OPEN': return <AlertTriangle className="h-4 w-4" />;
            case 'UNDER_REVIEW': return <Clock className="h-4 w-4" />;
            case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
            case 'REFUNDED': return <CheckCircle className="h-4 w-4" />;
            case 'CANCELLED': return <XCircle className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                        <PageHeader title="Admin Dispute Details" />
                        <main className="flex-1 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p>Loading dispute details...</p>
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    if (!dispute) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                        <PageHeader title="Dispute Not Found" />
                        <main className="flex-1 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Dispute Not Found</h2>
                                <p className="text-muted-foreground mb-4">The dispute you're looking for doesn't exist.</p>
                                <Button onClick={() => navigate('/admin/disputes')}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Disputes
                                </Button>
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader
                        title={`Admin - Dispute #${dispute.id.slice(-8)}`}
                        description={`Order #${dispute.orderId.slice(-8)} - ${dispute.reason}`}
                    />

                    <main className="flex-1 p-6">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Status Header */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Badge className={`${getStatusColor(dispute.status)} text-lg`}>
                                                {getStatusIcon(dispute.status)}
                                                <span className="ml-2">{dispute.status.replace('_', ' ')}</span>
                                            </Badge>
                                            <div className="text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 inline mr-1" />
                                                Created {formatDate(dispute.createdAt)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Raised by</div>
                                                <div className="font-semibold">{dispute.raisedBy.name}</div>
                                                <div className="text-xs text-muted-foreground">{dispute.raisedBy.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs Navigation */}
                            <div className="flex border-b">
                                {['overview', 'evidence', 'chat', 'resolution'].map((tab) => (
                                    <Button
                                        key={tab}
                                        variant="ghost"
                                        className={`rounded-none border-b-2 ${activeTab === tab
                                                ? 'border-primary text-primary'
                                                : 'border-transparent'
                                            }`}
                                        onClick={() => setActiveTab(tab as any)}
                                    >
                                        {tab === 'overview' && <FileText className="h-4 w-4 mr-2" />}
                                        {tab === 'evidence' && <Eye className="h-4 w-4 mr-2" />}
                                        {tab === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
                                        {tab === 'resolution' && <Shield className="h-4 w-4 mr-2" />}
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Dispute Information */}
                                    <Card className="lg:col-span-2">
                                        <CardHeader>
                                            <CardTitle>Dispute Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Reason</label>
                                                    <p className="font-semibold">{dispute.reason}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Order Amount</label>
                                                    <p className="font-semibold">{dispute.order?.totalAmount} ETB</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                <p className="mt-1 p-3 bg-muted rounded-lg">{dispute.description}</p>
                                            </div>
                                            {dispute.resolution && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Resolution</label>
                                                    <p className="mt-1 text-green-600 font-semibold">{dispute.resolution}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Quick Actions */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => setActiveTab('evidence')}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review Evidence
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => setActiveTab('chat')}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Join Conversation
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => setShowResolutionPanel(true)}
                                            >
                                                <Shield className="h-4 w-4 mr-2" />
                                                Force Resolution
                                            </Button>
                                            <Separator />
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => window.open(`/orders/${dispute.orderId}`, '_blank')}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                View Order Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'evidence' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Evidence Files</CardTitle>
                                        <CardDescription>
                                            All evidence submitted by both parties
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {evidence.length === 0 ? (
                                            <div className="text-center py-8">
                                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No evidence files uploaded yet.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {evidence.map((item) => (
                                                    <Card key={item.id} className="overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <FileText className="h-8 w-8 text-blue-500" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{item.filename}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        By {item.uploadedBy?.name || 'Unknown'} • {Math.round(item.fileSize / 1024)} KB
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatDate(item.uploadedAt)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1"
                                                                    onClick={() => window.open(item.url, '_blank')}
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => window.open(item.url, '_blank')}
                                                                >
                                                                    <Download className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

{activeTab === 'chat' && (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Main Chat */}
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Dispute Communication</CardTitle>
        <CardDescription>
          Communicate with both parties. Your messages will be visible to everyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto p-2">
          {messages.filter(m => !m.isInternal).length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet.</p>
              <p className="text-sm text-muted-foreground">Start the conversation...</p>
            </div>
          ) : (
            messages.filter(m => !m.isInternal).map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender.id === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-[70%] ${message.sender.id === user?.id ? 'text-right' : ''}`}>
                  {/* Sender Name and Role Badge */}
                  <div className={`flex items-center gap-2 mb-1 ${message.sender.id === user?.id ? 'justify-end' : ''}`}>
                    <span className="text-sm font-medium">
                      {message.sender.id === user?.id ? 'You' : message.sender.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        message.sender.role === 'ADMIN' 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : message.sender.role === 'PRODUCER'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {message.sender.role.toLowerCase()}
                    </Badge>
                  </div>
                  
                  {/* Message Content */}
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      message.sender.id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : message.sender.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  
                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Admin Message Input */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message to both parties..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              className="h-auto"
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Internal Notes & Participants */}
    <div className="space-y-6">
      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Internal Notes
          </CardTitle>
          <CardDescription className="text-xs">
            Private notes for admin team only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {messages.filter(m => m.isInternal).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No internal notes yet
              </p>
            ) : (
              messages.filter(m => m.isInternal).map((note) => (
                <div key={note.id} className="text-xs p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {note.sender.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{note.sender.name}</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                      Admin
                    </Badge>
                  </div>
                  <p className="mb-1">{note.content}</p>
                  <p className="text-muted-foreground">
                    {new Date(note.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Textarea
              placeholder="Add internal note for admin team..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="min-h-[60px] text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInternalNote();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSendInternalNote}
              disabled={sendingInternalNote || !internalNote.trim()}
              className="h-auto"
            >
              {sendingInternalNote ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Dispute Raiser */}
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                {dispute.raisedBy.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{dispute.raisedBy.name}</p>
              <p className="text-xs text-muted-foreground">Buyer (Reporter)</p>
            </div>
          </div>

          {/* Producers (if any) */}
          {dispute.order?.orderItems?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-green-100 text-green-800">
                  {item.product.producer.businessName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {item.product.producer.businessName || 'Producer'}
                </p>
                <p className="text-xs text-muted-foreground">Seller</p>
              </div>
            </div>
          ))}

          {/* Admin (You) */}
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-purple-100 text-purple-800">
                You
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">You</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </CardContent>
      </Card>
     </div>
    </div>
   )}

                            {activeTab === 'resolution' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Resolution Center</CardTitle>
                                        <CardDescription>
                                            Make a final decision on this dispute
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Card
                                                    className={`cursor-pointer border-2 ${resolutionData.type === 'RESOLVED'
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200'
                                                        }`}
                                                    onClick={() => setResolutionData(prev => ({ ...prev, type: 'RESOLVED' }))}
                                                >
                                                    <CardContent className="p-4 text-center">
                                                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                                        <p className="font-semibold">Resolve</p>
                                                        <p className="text-xs text-muted-foreground">Close dispute as resolved</p>
                                                    </CardContent>
                                                </Card>

                                                <Card
                                                    className={`cursor-pointer border-2 ${resolutionData.type === 'REFUNDED'
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200'
                                                        }`}
                                                    onClick={() => setResolutionData(prev => ({ ...prev, type: 'REFUNDED' }))}
                                                >
                                                    <CardContent className="p-4 text-center">
                                                        <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                                        <p className="font-semibold">Refund</p>
                                                        <p className="text-xs text-muted-foreground">Process refund to buyer</p>
                                                    </CardContent>
                                                </Card>

                                                <Card
                                                    className={`cursor-pointer border-2 ${resolutionData.type === 'CANCELLED'
                                                            ? 'border-red-500 bg-red-50'
                                                            : 'border-gray-200'
                                                        }`}
                                                    onClick={() => setResolutionData(prev => ({ ...prev, type: 'CANCELLED' }))}
                                                >
                                                    <CardContent className="p-4 text-center">
                                                        <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                                        <p className="font-semibold">Cancel</p>
                                                        <p className="text-xs text-muted-foreground">Cancel the dispute</p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {resolutionData.type === 'REFUNDED' && (
                                                <div>
                                                    <label className="text-sm font-medium">Refund Amount (ETB)</label>
                                                    <div className="flex gap-2 mt-1">
                                                        <div className="flex-1 relative">
                                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <input
                                                                type="number"
                                                                placeholder="Enter refund amount"
                                                                value={resolutionData.refundAmount}
                                                                onChange={(e) => setResolutionData(prev => ({
                                                                    ...prev,
                                                                    refundAmount: e.target.value
                                                                }))}
                                                                className="flex-1 pl-9 px-3 py-2 border rounded-md"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setResolutionData(prev => ({
                                                                ...prev,
                                                                refundAmount: dispute.order?.totalAmount?.toString() || ''
                                                            }))}
                                                        >
                                                            Full Amount
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-sm font-medium">Resolution Notes</label>
                                                <Textarea
                                                    placeholder="Explain your decision and reasoning..."
                                                    value={resolutionData.resolutionNote}
                                                    onChange={(e) => setResolutionData(prev => ({
                                                        ...prev,
                                                        resolutionNote: e.target.value
                                                    }))}
                                                    rows={4}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <Button
                                                onClick={handleForceResolution}
                                                disabled={!resolutionData.resolutionNote.trim() ||
                                                    (resolutionData.type === 'REFUNDED' && !resolutionData.refundAmount)}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <Shield className="h-4 w-4 mr-2" />
                                                Enforce Resolution
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default AdminDisputeDetail;