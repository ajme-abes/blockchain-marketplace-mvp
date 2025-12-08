import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  photo?: string;
  userId?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const TestimonialsSection = () => {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await api.getPublishedTestimonials(6);

      if (response.status === 'success' && response.data) {
        setTestimonials(response.data);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-full mb-4 shadow-lg">
            <MessageSquare className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">Customer Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [paint-order:stroke_fill]" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trusted By Our Community
            </span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            Real experiences from verified producers and buyers who trust our platform
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading testimonials...</p>
          </div>
        )}

        {/* Testimonials Grid with Staggered Animation */}
        {!loading && testimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className="group relative overflow-hidden border-2 border-border hover:border-primary/50 shadow-card hover:shadow-card-hover transition-all duration-500 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="relative p-6 space-y-4">
                  {/* Quote Icon */}
                  <div className="relative">
                    <Quote className="h-10 w-10 text-primary/10 group-hover:text-primary/20 transition-colors duration-300" />
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:scale-110">
                        <AvatarImage 
                          src={testimonial.user?.avatarUrl || testimonial.photo} 
                          alt={testimonial.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="gradient-primary text-white font-bold text-xl">
                          {testimonial.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {testimonial.userId && (
                        <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1.5 shadow-lg animate-pulse-slow">
                          <ShieldCheck className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                          {testimonial.name}
                        </h4>
                        {testimonial.userId && (
                          <Badge variant="success" className="text-xs px-2 py-0.5 shadow-sm">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize font-medium">
                        {testimonial.role.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 transition-all duration-300 ${
                          i < testimonial.rating
                            ? 'fill-yellow-400 text-yellow-400 group-hover:scale-110'
                            : 'text-gray-300'
                        }`}
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>

                  {/* Testimonial Message */}
                  <p className="text-muted-foreground leading-relaxed line-clamp-4 group-hover:text-foreground transition-colors duration-300">
                    "{testimonial.message}"
                  </p>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground/60 pt-2 border-t border-border/50">
                    {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && testimonials.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Testimonials Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Be the first to share your experience with our marketplace community!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
