import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { TestimonialForm } from '@/components/testimonials/TestimonialForm';
import { MessageSquare } from 'lucide-react';

const ShareTestimonial = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-warm">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="Share Your Experience" />
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-glow mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gradient">
                  Share Your Story
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Your feedback helps us improve and helps others make informed decisions
                </p>
              </div>

              {/* Form */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <TestimonialForm />
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary mb-1">✓</div>
                  <p className="text-sm font-medium">Verified Users</p>
                  <p className="text-xs text-muted-foreground mt-1">Your profile is linked</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary mb-1">⚡</div>
                  <p className="text-sm font-medium">Quick Review</p>
                  <p className="text-xs text-muted-foreground mt-1">Published within 24h</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary mb-1">🌟</div>
                  <p className="text-sm font-medium">Build Trust</p>
                  <p className="text-xs text-muted-foreground mt-1">Help the community</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ShareTestimonial;
