import { useState, useEffect } from 'react';
import { generateTravelPlan } from '@/lib/openai';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import type { TravelSuggestions } from '@/types';
import { TravelForm, FormValues } from '@/components/TravelForm';
import { TravelResults } from '@/components/TravelResults';
import { Header } from './components/Header';
import { analytics } from '@/lib/analytics';
import { updateMetaTags } from '@/lib/metaUpdater';

function App() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get('lang') as 'en' | 'fr') || 'en';
  });
  const [suggestions, setSuggestions] = useState<TravelSuggestions | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [formData, setFormData] = useState<FormValues | null>(null);

  useEffect(() => {
    analytics.trackPageView('Home');
  }, []);

  useEffect(() => {
    if (window.google || document.querySelector('script[src*="maps.googleapis.com"]')) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    updateMetaTags(language);
  }, [language]);

  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newLang = urlParams.get('lang') as 'en' | 'fr';
      if (newLang && (newLang === 'en' || newLang === 'fr')) {
        setLanguage(newLang);
        analytics.trackLanguageChange(newLang);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleLanguageChange = (newLanguage: 'en' | 'fr') => {
    setLanguage(newLanguage);
    analytics.trackLanguageChange(newLanguage);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setSuggestions(null);
    setFormData(data);
    
    try {
      const result = await generateTravelPlan({
        destination: data.destination,
        date: data.date,
        duration: data.duration,
        interests: data.interests,
      });

      setSuggestions(result);
      
      toast({
        title: language === 'en' ? 'Success' : 'Succès',
        description: language === 'en' ? 'Travel plan generated successfully!' : 'Plan de voyage généré avec succès !',
      });
      analytics.trackTravelPlanGenerated(data.destination, data.duration, data.interests);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: language === 'en' ? 'Error' : 'Erreur',
        description: language === 'en' 
          ? `Failed to generate travel plan: ${error instanceof Error ? error.message : 'Unknown error'}` 
          : `Échec de la génération du plan de voyage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuggestions(null);
    setFormData(null);
    analytics.trackReset();
  };

  if (!isGoogleMapsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'en' ? 'Loading...' : 'Chargement...'}
          </h1>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'Please wait while we load the necessary resources.' 
              : 'Veuillez patienter pendant le chargement des ressources nécessaires.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <TravelForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          language={language}
          onReset={handleReset}
        />

        {suggestions && formData && (
          <TravelResults
            suggestions={suggestions}
            language={language}
            duration={formData.duration}
            destination={formData.destination}
            interests={formData.interests}
          />
        )}
      </main>
      <Toaster />
    </div>
  );
}

export default App;