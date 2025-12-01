import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import heroImage1 from '@/assets/hero-carousel-1.jpeg';
import heroImage2 from '@/assets/hero-carousel-2.jpeg';
import heroImage3 from '@/assets/hero-carousel-3.jpeg';

const slides = [
  {
    image: heroImage1,
    caption: { 
      en: 'Direct from Ethiopian Coffee Farmers', 
      amh: 'በቀጥታ ከኢትዮጵያ የቡና አምራቾች' 
    },
    subtitle: {
      en: 'Premium coffee beans sourced directly from local farmers',
      amh: 'ከአካባቢ አርሶ አደሮች በቀጥታ የተመረጡ ማራቃት ያላቸው የቡና አዝመራዎች'
    },
    cta: { en: 'Explore Coffee', amh: 'ቡናን ያስሱ' },
    priority: true
  },
  {
    image: heroImage2,
    caption: { 
      en: 'Fresh Produce from Local Markets', 
      amh: 'ከአካባቢያዊ ገበያዎች ትኩስ ምርት' 
    },
    subtitle: {
      en: 'Farm-fresh vegetables and fruits delivered to your doorstep',
      amh: 'ከፍርነስ ትኩስ አትክልት እና ፍራፍሬዎች ወደ በርዎ ይደርሳሉ'
    },
    cta: { en: 'Shop Fresh', amh: 'ትኩስ ይግዙ' }
  },
  {
    image: heroImage3,
    caption: { 
      en: 'Pure Ethiopian Honey Direct from Beekeepers', 
      amh: 'ንፁህ የኢትዮጵያ ማር በቀጥታ ከንብ አራቢዎች' 
    },
    subtitle: {
      en: '100% natural honey from sustainable beekeeping practices',
      amh: '100% ተፈጥሯዊ ማር ከተጠናከረ ንብ አራቢነት ልምዶች'
    },
    cta: { en: 'Discover More', amh: 'ተጨማሪ ያግኙ' }
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: number]: boolean }>({});
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { language, t } = useLanguage(); 

  const memoizedSlides = useMemo(() => slides, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % memoizedSlides.length);
  }, [memoizedSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + memoizedSlides.length) % memoizedSlides.length);
  }, [memoizedSlides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') toggleAutoPlay();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide, toggleAutoPlay]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    
    setTouchStart(null);
  };

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  };

  return (
    <section 
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {memoizedSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            index === currentSlide 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-105'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.caption[language]}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              imagesLoaded[index] ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(index)}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
          {/* Enhanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl animate-in fade-in duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Ethiopia's Trusted Marketplace</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-in slide-in-from-bottom-8">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </h1>

          {/* Slide-specific Content */}
          <div className="mb-8 space-y-4">
            <p className="text-2xl md:text-3xl font-semibold text-foreground/90 animate-in slide-in-from-bottom-8 delay-150">
              {memoizedSlides[currentSlide].caption[language]}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-in slide-in-from-bottom-8 delay-300">
              {memoizedSlides[currentSlide].subtitle[language]}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 animate-in slide-in-from-bottom-8 delay-500">
            <Link to="/marketplace">
              <Button 
                size="lg" 
                variant="hero" 
                className="rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                {memoizedSlides[currentSlide].cta[language]}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-8 py-6 text-lg font-semibold border-2 hover:border-primary/50 transition-all duration-300"
              >
                {t('common.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-12 animate-in fade-in delay-700">
            {[
              { number: '500+', label: 'Verified Producers' },
              { number: '10K+', label: 'Happy Customers' },
              { number: '98%', label: 'Satisfaction Rate' }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6">
        {/* Slide Indicators */}
        <div className="flex gap-3">
          {memoizedSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative transition-all duration-300 ${
                index === currentSlide ? 'w-8' : 'w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentSlide 
                    ? 'bg-primary shadow-lg shadow-primary/50' 
                    : 'bg-background/60 hover:bg-background/80'
                }`}
              />
              {index === currentSlide && (
                <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Auto-play Toggle */}
        <button
          onClick={toggleAutoPlay}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
          aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isAutoPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background hover:scale-110 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background hover:scale-110 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </section>
  );
};