import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Calendar
} from 'lucide-react';
import { disputeService, Dispute, DisputeEvidence, DisputeMessage } from '@/services/disputeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DisputeDetail = () => {
    const { disputeId } = useParams<{ disputeId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
    const [messages, setMessages] = useState<DisputeMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'chat'>('details');
    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [resolvingDispute, setResolvingDispute] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');

    useEffect(() => {
        if (disputeId) {
            fetchDisputeDetails();
        }
    }, [disputeId]);

    const fetchDisputeDetails = async () => {
        try {
            setLoading(true);
            const result = await disputeService.getDisputeDetails(disputeId!);

            if (result.status === 'success' && result.data) {
                setDispute(result.data);
                // You might need to fetch evidence and messages separately
                await fetchEvidence();
                await fetchMessages();
            } else {
                throw new Error(result.message || 'Failed to fetch dispute details');
            }
        } catch (error: any) {
            console.error('Failed to fetch dispute details:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to load dispute details",
                variant: "destructive",
            });
            navigate('/disputes');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvidence = async () => {
        try {
            // You might need to add this method to your disputeService
            const result = await disputeService.getDisputeEvidence(disputeId!);
            if (result.status === 'success' && result.data) {
                setEvidence(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch evidence:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            // You might need to add this method to your disputeService
            const result = await disputeService.getDisputeMessages(disputeId!);
            if (result.status === 'success' && result.data) {
                setMessages(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);
            const result = await disputeService.addMessage(disputeId!, newMessage.trim());

            if (result.status === 'success') {
                setNewMessage('');
                await fetchMessages(); // Refresh messages
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'bg-yellow-500 text-white';
            case 'UNDER_REVIEW':
                return 'bg-blue-500 text-white';
            case 'RESOLVED':
                return 'bg-green-500 text-white';
            case 'REFUNDED':
                return 'bg-green-500 text-white';
            case 'CANCELLED':
                return 'bg-red-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OPEN':
                return <AlertTriangle className="h-4 w-4" />;
            case 'UNDER_REVIEW':
                return <Clock className="h-4 w-4" />;
            case 'RESOLVED':
                return <CheckCircle className="h-4 w-4" />;
            case 'REFUNDED':
                return <CheckCircle className="h-4 w-4" />;
            case 'CANCELLED':
                return <XCircle className="h-4 w-4" />;
            default:
                return <AlertTriangle className="h-4 w-4" />;
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
    const handleAddEvidence = async (files: FileList | null) => {
        if (!files || !disputeId) return;
      
        const file = files[0]; // Take first file for simplicity
        if (!file) return;
      
        try {
          setUploadingEvidence(true);
          
          const result = await disputeService.uploadEvidence(
            disputeId,
            file,
            'Additional evidence uploaded'
          );
      
          if (result.status === 'success') {
            toast({
              title: "Evidence Added",
              description: "File uploaded successfully",
            });
            await fetchEvidence(); // Refresh evidence list
          } else {
            throw new Error(result.message || 'Failed to upload evidence');
          }
        } catch (error: any) {
          console.error('Failed to upload evidence:', error);
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload evidence",
            variant: "destructive",
          });
        } finally {
          setUploadingEvidence(false);
        }
      };
      
      const handleResolveDispute = async () => {
        if (!disputeId || !resolutionNote.trim()) return;
      
        try {
          setResolvingDispute(true);
          
          const result = await disputeService.resolveDispute(
            disputeId,
            resolutionNote
          );
      
          if (result.status === 'success') {
            toast({
              title: "Dispute Resolved",
              description: "The dispute has been marked as resolved",
            });
            setShowResolveModal(false);
            setResolutionNote('');
            await fetchDisputeDetails(); // Refresh dispute data
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
        } finally {
          setResolvingDispute(false);
        }
      };
      
      const canResolveDispute = () => {
        if (!user || !dispute) return false;
        
        // Only allow resolution for OPEN disputes
        if (dispute.status !== 'OPEN') return false;
        
        // ONLY the user who raised the dispute can resolve it
        return user.id === dispute.raisedBy.id;
      };

    if (loading) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                        <PageHeader title="Dispute Details" />
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
                                <Button onClick={() => navigate('/disputes')}>
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
                        title={`Dispute #${dispute.id.slice(-8)}`}
                        description={`Order #${dispute.orderId.slice(-8)} - ${dispute.reason}`}
                        action={
                            <Button variant="outline" onClick={() => navigate('/disputes')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Disputes
                            </Button>
                        }
                    />

                    <main className="flex-1 p-6">
                        <div className="max-w-6xl mx-auto space-y-6">
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
        </div>
        
        {/* Resolution Button */}
        {canResolveDispute() && (
          <Button
            onClick={() => setShowResolveModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        )}
      </div>
    </div>
  </CardContent>
</Card>

                            {/* Tabs Navigation */}
                            <div className="flex border-b">
                                <Button
                                    variant="ghost"
                                    className={`rounded-none border-b-2 ${activeTab === 'details'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent'
                                        }`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Details
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={`rounded-none border-b-2 ${activeTab === 'evidence'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent'
                                        }`}
                                    onClick={() => setActiveTab('evidence')}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Evidence ({evidence.length})
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={`rounded-none border-b-2 ${activeTab === 'chat'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent'
                                        }`}
                                    onClick={() => setActiveTab('chat')}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Messages ({messages.length})
                                </Button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Dispute Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Dispute Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                                                <p className="font-semibold">{dispute.reason}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                <p className="mt-1">{dispute.description}</p>
                                            </div>
                                            {dispute.resolution && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Resolution</label>
                                                    <p className="mt-1 text-green-600">{dispute.resolution}</p>
                                                </div>
                                            )}
                                            {dispute.refundAmount && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Refund Amount</label>
                                                    <p className="mt-1 font-semibold text-green-600">
                                                        {dispute.refundAmount} ETB
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Order Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Order Information</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Order ID</span>
                                                    <span className="font-medium">#{dispute.orderId.slice(-8)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Amount</span>
                                                    <span className="font-medium">{dispute.order?.totalAmount} ETB</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Buyer</span>
                                                    <span className="font-medium">{dispute.order?.buyer?.user?.name}</span>
                                                </div>
                                                <Separator />
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => navigate(`/orders/${dispute.orderId}`)}
                                                >
                                                    View Order Details
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

{activeTab === 'evidence' && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>Evidence Files</span>
        {dispute.status === 'OPEN' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('additional-evidence')?.click()}
            disabled={uploadingEvidence}
          >
            {uploadingEvidence ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Add Evidence
              </>
            )}
          </Button>
        )}
      </CardTitle>
      <CardDescription>
        Supporting documents and images for this dispute
        <input
          id="additional-evidence"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleAddEvidence(e.target.files)}
          className="hidden"
        />
      </CardDescription>
    </CardHeader>
    <CardContent>
      {evidence.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No evidence files uploaded yet.</p>
          {dispute.status === 'OPEN' && (
            <Button
              onClick={() => document.getElementById('additional-evidence')?.click()}
              disabled={uploadingEvidence}
              className="mt-4"
            >
              {uploadingEvidence ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Upload First Evidence
                </>
              )}
            </Button>
          )}
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
                      {Math.round(item.fileSize / 1024)} KB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {item.uploadedBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
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
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Messages */}
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Dispute Communication</CardTitle>
        <CardDescription>
          Communicate with the other party to resolve this dispute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto p-2">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet.</p>
              <p className="text-sm text-muted-foreground">Start the conversation...</p>
            </div>
          ) : (
            messages.map((message) => (
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
        
        {/* Message Input */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
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

    {/* Participants */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Participants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dispute Raiser */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {dispute.raisedBy.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{dispute.raisedBy.name}</p>
              <p className="text-sm text-muted-foreground">Buyer (Reporter)</p>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 mt-1">
                buyer
              </Badge>
            </div>
          </div>

          {/* Producers (if any) */}
          {dispute.order?.orderItems?.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-800">
                  {item.product.producer.businessName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {item.product.producer.businessName || 'Producer'}
                </p>
                <p className="text-sm text-muted-foreground">Seller</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 mt-1">
                  producer
                </Badge>
              </div>
            </div>
          ))}

          {/* Current User (You) */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-purple-100 text-purple-800">
                You
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">You</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'BUYER' ? 'Buyer' : 'Producer'}
              </p>
              <Badge variant="outline" className={
                user?.role === 'BUYER' 
                  ? 'bg-gray-100 text-gray-800 mt-1'
                  : 'bg-green-100 text-green-800 mt-1'
              }>
                {user?.role?.toLowerCase()}
              </Badge>
            </div>
          </div>

          {/* Admin (if involved) */}
          {messages.some(m => m.sender.role === 'ADMIN') && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  A
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Admin Support</p>
                <p className="text-sm text-muted-foreground">Platform Moderator</p>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 mt-1">
                  admin
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Dispute Status Info */}
        <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Dispute Status</p>
          </div>
          <Badge className={getStatusColor(dispute.status)}>
            {getStatusIcon(dispute.status)}
            <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
          </Badge>
          <p className="text-xs text-yellow-700 mt-2">
            {dispute.status === 'OPEN' && 'This dispute is currently open and awaiting resolution.'}
            {dispute.status === 'UNDER_REVIEW' && 'An admin is currently reviewing this dispute.'}
            {dispute.status === 'RESOLVED' && 'This dispute has been resolved.'}
            {dispute.status === 'REFUNDED' && 'A refund has been processed for this dispute.'}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
)}

{/* Resolution Modal */}
{showResolveModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Resolve Dispute
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please provide a resolution note
        </p>
      </div>

      <div className="p-6">
        <Textarea
          placeholder="Describe how the dispute was resolved..."
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-2">
          This note will be visible to all parties involved.
        </p>
      </div>

      <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setShowResolveModal(false);
            setResolutionNote('');
          }}
          disabled={resolvingDispute}
        >
          Cancel
        </Button>
        <Button
          onClick={handleResolveDispute}
          disabled={resolvingDispute || !resolutionNote.trim()}
          className="bg-green-600 hover:bg-green-700"
        >
          {resolvingDispute ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Resolving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Resolution
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
)}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default DisputeDetail;