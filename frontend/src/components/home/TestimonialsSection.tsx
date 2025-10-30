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
    <section className="py-16 gradient-subtle">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('testimonials.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {mockTestimonials.map(testimonial => (
            <Card key={testimonial.id} className="shadow-card">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">{testimonial.message}</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.photo} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-center">Share Your Experience</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Producer">Producer</option>
                </select>
                <Textarea
                  placeholder="Share your experience..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
                <Button type="submit" variant="hero" className="w-full">
                  Submit Testimonial
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
