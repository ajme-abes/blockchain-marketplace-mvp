import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';
import { mockTestimonials } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const TestimonialsSection = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', role: 'Buyer', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you for sharing your experience!');
    setFormData({ name: '', role: 'Buyer', message: '' });
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real feedback from producers and buyers using our platform
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mockTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-muted-foreground mb-4" />
                
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.photo} />
                    <AvatarFallback className="bg-muted">
                      {testimonial.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {testimonial.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Share Experience Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="border border-border">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Share Your Experience</h3>
                <p className="text-muted-foreground">
                  Help others discover the benefits of our marketplace
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-background"
                  />
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Producer">Producer</option>
                  </select>
                </div>
                
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                  className="bg-background resize-none"
                />
                
                <div className="text-center">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                  >
                    Submit Testimonial
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};