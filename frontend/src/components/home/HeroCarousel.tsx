import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import heroImage1 from '@/assets/hero-carousel-1.jpg';
import heroImage2 from '@/assets/hero-carousel-2.jpg';
import heroImage3 from '@/assets/hero-carousel-3.jpg';

const slides = [
  {
    image: heroImage1,
    caption: { en: 'Connecting with Ethiopian Coffee Farmers', amh: 'ከኢትዮጵያ የቡና አምራቾች ጋር መገናኘት' },
    cta: { en: 'Explore Coffee', amh: 'ቡናን ያስሱ' },
    priority: true
  },
  {
    image: heroImage2,
    caption: { en: 'Fresh Produce from Local Markets', amh: 'ከአካባቢያዊ ገበያዎች ትኩስ ምርት' },
    cta: { en: 'Shop Fresh', amh: 'ትኩስ ይግዙ' }
  },
  {
    image: heroImage3,
    caption: { en: 'Pure Ethiopian Honey Direct from Beekeepers', amh: 'ንፁህ የኢትዮጵያ ማር በቀጥታ ከንብ አራቢዎች' },
    cta: { en: 'Discover More', amh: 'ተጨማሪ ያግኙ' }
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const { language, t } = useLanguage();

  const memoizedSlides = useMemo(() => slides, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % memoizedSlides.length);
  }, [memoizedSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + memoizedSlides.length) % memoizedSlides.length);
  }, [memoizedSlides.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  // Touch/swipe handling
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    
    setTouchStart(null);
  };

  const handleImageLoad = (index) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  };

  return (
    <section 
      className="relative min-h-[600px] flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {memoizedSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.caption[language]}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imagesLoaded[index] ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(index)}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl animate-in fade-in duration-1000">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-in slide-in-from-bottom-8">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-4 animate-in slide-in-from-bottom-8 delay-150">
            {memoizedSlides[currentSlide].caption[language]}
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-in slide-in-from-bottom-8 delay-300">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4 animate-in slide-in-from-bottom-8 delay-500">
            <Link to="/marketplace">
              <Button size="lg" variant="hero" className="text-lg">
                {memoizedSlides[currentSlide].cta[language]}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg">
                {t('common.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background p-2 rounded-full transition-smooth"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background p-2 rounded-full transition-smooth"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {memoizedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-background/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide}
          />
        ))}
      </div>
    </section>
  );
};