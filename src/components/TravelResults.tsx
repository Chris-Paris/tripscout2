import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Map, MapPin, Share2, Loader2 } from 'lucide-react';
import { TravelSuggestions } from '@/types';
import { LocationPhotos } from './LocationPhotos';
import { StaticMap } from './StaticMap';
import { getGoogleMapsUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { generateMoreAttractions, generateMoreHiddenGems, generateMoreActivities } from "@/lib/openai";
import { analytics } from '@/lib/analytics';
import { Button } from "./ui/button";
import { formatTravelPlanForSharing, shareContent } from "@/lib/shareUtils";

interface TravelResultsProps {
  suggestions: TravelSuggestions;
  language: 'en' | 'fr';
  duration: number;
  destination: string;
  interests: string[];
}

interface SectionState {
  attractions: boolean;
  restaurants: boolean;
  gems: boolean;
  activities: boolean;
  itinerary: boolean;
  events: boolean;
  accommodation: boolean;
}

const interestTranslations: Record<string, string> = {
  'Food & Dining': 'Gastronomie',
  'History & Culture': 'Histoire & Culture',
  'Nature & Outdoors': 'Nature & Plein Air',
  'Shopping': 'Shopping',
  'Art & Museums': 'Art & Musées',
  'Nightlife': 'Vie Nocturne',
  'Sports': 'Sports',
  'Relaxation': 'Détente',
  'Adventure': 'Aventure',
  'Local Experience': 'Expérience Locale',
  'Photography': 'Photographie',
  'Architecture': 'Architecture',
  'Couple Trip': 'Voyage en Couple'
};

const findRelevantInterests = (description: string = '', interests: string[] = []) => {
  return interests.filter(interest => {
    const englishTerm = interest.toLowerCase();
    const frenchTerm = interestTranslations[interest]?.toLowerCase() || '';
    return description.toLowerCase().includes(englishTerm) || 
           description.toLowerCase().includes(frenchTerm);
  });
};

export function TravelResults({ 
  suggestions, 
  language, 
  duration, 
  destination,
  interests
}: TravelResultsProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    attractions: true,
    restaurants: true,
    gems: true,
    activities: true,
    itinerary: true,
    events: true,
    accommodation: true
  });
  const [additionalAttractions, setAdditionalAttractions] = useState<any[]>([]);
  const [additionalGems, setAdditionalGems] = useState<any[]>([]);
  const [additionalActivities, setAdditionalActivities] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState<Record<string, boolean>>({
    attractions: false,
    gems: false,
    activities: false
  });
  const resultsTitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analytics.trackViewTravelResults(destination);
  }, [destination]);

  useEffect(() => {
    if (resultsTitleRef.current) {
      resultsTitleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [suggestions]);

  const toggleSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLoadMoreAttractions = async () => {
    analytics.trackLoadMore('attractions', destination);
    setIsLoadingMore(prev => ({ ...prev, attractions: true }));
    try {
      const newAttractions = await generateMoreAttractions(destination);
      setAdditionalAttractions(prev => [...prev, ...newAttractions]);
      toast({
        title: language === 'en' ? 'Success!' : 'Succès !',
        description: language === 'en' 
          ? 'New attractions have been added to the list.' 
          : 'De nouvelles attractions ont été ajoutées à la liste.',
      });
    } catch (error) {
      console.error('Error loading more attractions:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Erreur',
        description: language === 'en'
          ? 'Failed to load more attractions. Please try again.'
          : 'Impossible de charger plus d\'attractions. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(prev => ({ ...prev, attractions: false }));
    }
  };

  const handleLoadMoreGems = async () => {
    analytics.trackLoadMore('hiddenGems', destination);
    setIsLoadingMore(prev => ({ ...prev, gems: true }));
    try {
      const newGems = await generateMoreHiddenGems(destination);
      setAdditionalGems(prev => [...prev, ...newGems]);
      toast({
        title: language === 'en' ? 'Success!' : 'Succès !',
        description: language === 'en' 
          ? 'New hidden gems have been added to the list.' 
          : 'De nouveaux trésors cachés ont été ajoutés à la liste.',
      });
    } catch (error) {
      console.error('Error loading more hidden gems:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Erreur',
        description: language === 'en'
          ? 'Failed to load more hidden gems. Please try again.'
          : 'Impossible de charger plus de trésors cachés. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(prev => ({ ...prev, gems: false }));
    }
  };

  const handleLoadMoreActivities = async () => {
    analytics.trackLoadMore('activities', destination);
    setIsLoadingMore(prev => ({ ...prev, activities: true }));
    try {
      const newActivities = await generateMoreActivities(destination);
      setAdditionalActivities(prev => [...prev, ...newActivities]);
      toast({
        title: language === 'en' ? 'Success!' : 'Succès !',
        description: language === 'en' 
          ? 'New activity ideas have been added to the list.' 
          : 'De nouvelles idées d\'activités ont été ajoutées à la liste.',
      });
    } catch (error) {
      console.error('Error loading more activities:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Erreur',
        description: language === 'en'
          ? 'Failed to load more activities. Please try again.'
          : 'Impossible de charger plus d\'activités. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(prev => ({ ...prev, activities: false }));
    }
  };

  const handleShare = async () => {
    const formattedText = formatTravelPlanForSharing(suggestions, language);
    const success = await shareContent(formattedText);
    
    if (success) {
      toast({
        title: "Copied!",
        description: "Link copied to clipboard"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const ResultSection = ({ title, items, type }: { title: string; items: any[]; type: keyof SectionState }) => {
    // Don't render the section if it's events and there are no items
    if (type === 'events' && items.length === 0) {
      return null;
    }

    const allItems = type === 'attractions' 
      ? [...items, ...additionalAttractions]
      : type === 'gems'
      ? [...items, ...additionalGems]
      : type === 'activities'
      ? [...items, ...additionalActivities]
      : items;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection(type)}
        >
          <h2 className="text-xl font-semibold">{title}</h2>
          {expandedSections[type] ? <ChevronUp /> : <ChevronDown />}
        </div>
        {expandedSections[type] && (
          <div className="mt-4 space-y-4">
            {type === 'accommodation' && (
              <div className="flex gap-4 mb-6">
                <a
                  href={`https://${language === 'fr' ? 'fr' : 'www'}.airbnb.com/s/${encodeURIComponent(suggestions.destination.name)}/homes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-[#FF5A5F] text-white rounded-md hover:bg-[#FF5A5F]/90 transition-colors"
                >
                  {language === 'en' ? 'Search on Airbnb' : 'Rechercher sur Airbnb'}
                </a>
                <a
                  href={`https://${language === 'fr' ? 'fr' : 'www'}.booking.com/searchresults.html?ss=${encodeURIComponent(suggestions.destination.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-[#003580] text-white rounded-md hover:bg-[#003580]/90 transition-colors"
                >
                  {language === 'en' ? 'Search on Booking.com' : 'Rechercher sur Booking.com'}
                </a>
              </div>
            )}
            {type === 'itinerary' ? (
              <>
                <div className="space-y-8">
                  {items.map((day: { day: number; activities: string[] }) => (
                    <div key={day.day} className="border-b pb-6 last:border-b-0">
                      <h3 className="font-medium text-lg mb-4">
                        {language === 'en' ? `Day ${day.day}` : `Jour ${day.day}`}
                      </h3>
                      <div className="space-y-4">
                        {day.activities.map((activity: string) => (
                          <div className="flex items-start">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-description text-sm">{activity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium text-lg mb-4">
                    {language === 'en' ? 'Activity Ideas' : 'Idées d\'Activités'}
                  </h3>
                  <div className="space-y-6">
                    {additionalActivities.map((activity: { title: string; description: string; location: string; coordinates?: { lat: number; lng: number } }) => (
                      <div className="border-b pb-4 last:border-b-0">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-description text-sm mt-1">{activity.description}</p>
                        {activity.location && (
                          <div className="flex items-center text-gray-500 mt-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                        {activity.coordinates && (
                          <div className="mt-4 flex items-center gap-4">
                            <LocationPhotos
                              location={activity.title}
                              coordinates={activity.coordinates}
                              language={language}
                            />
                            <a
                              href={getGoogleMapsUrl(activity)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 bg-background border border-primary/20 hover:border-primary/50 text-primary rounded-md transition-colors"
                            >
                              <Map className="w-4 h-4 mr-2" />
                              <span>{language === 'en' ? 'See on Map' : 'Voir sur la carte'}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <button
                        onClick={handleLoadMoreActivities}
                        disabled={isLoadingMore.activities}
                        className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isLoadingMore.activities ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>{language === 'en' ? 'Loading...' : 'Chargement...'}</span>
                          </>
                        ) : (
                          <span>
                            {language === 'en' ? 'See More Activity Ideas' : 'Voir Plus d\'Idées d\'Activités'}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {allItems.map((item: { title: string; description: string; location?: string; coordinates?: { lat: number; lng: number } }) => {
                  const relevantInterests = findRelevantInterests(item.description, interests);
                  return (
                    <div className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium">{item.title}</h3>
                      {relevantInterests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {relevantInterests.map((interest, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-xs rounded-full text-white bg-[#c1121f] opacity-80"
                            >
                              {language === 'en' ? interest : (interestTranslations[interest] || interest)}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-description text-sm mt-1">{item.description}</p>
                      {item.location && (
                        <div className="flex items-center text-gray-500 mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.coordinates && (
                        <div className="mt-4 flex items-center gap-4">
                          <LocationPhotos
                            location={item.title}
                            coordinates={item.coordinates}
                            language={language}
                          />
                          <a
                            href={getGoogleMapsUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-background border border-primary/20 hover:border-primary/50 text-primary rounded-md transition-colors"
                          >
                            <Map className="w-4 h-4 mr-2" />
                            <span>{language === 'en' ? 'See on Map' : 'Voir sur la carte'}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(type === 'attractions' || type === 'gems' || type === 'activities') && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={type === 'attractions' ? handleLoadMoreAttractions : type === 'gems' ? handleLoadMoreGems : handleLoadMoreActivities}
                      disabled={isLoadingMore[type === 'attractions' ? 'attractions' : type === 'gems' ? 'gems' : 'activities']}
                      className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isLoadingMore[type === 'attractions' ? 'attractions' : type === 'gems' ? 'gems' : 'activities'] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>{language === 'en' ? 'Loading...' : 'Chargement...'}</span>
                        </>
                      ) : (
                        <span>
                          {language === 'en' ? 'See More Suggestions' : 'Voir Plus de Suggestions'}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div ref={resultsTitleRef}>
          <h2 className="text-2xl font-bold mb-6">
            {language === 'en'
              ? `Your ${duration}-Day Trip to ${destination}`
              : `Votre voyage de ${duration} jours à ${destination}`}
          </h2>
        </div>
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex items-center gap-2 py-2"
        >
          <Share2 className="w-4 h-4 mr-1" />
          {language === 'en' ? 'Share' : 'Partager'}
        </Button>
      </div>

      {suggestions.destination.coordinates && (
        <StaticMap
          suggestions={suggestions}
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        />
      )}

      <ResultSection
        title={language === 'en' ? 'Must-See Attractions' : 'Attractions Incontournables'}
        items={suggestions.mustSeeAttractions}
        type="attractions"
      />

      <ResultSection
        title={language === 'en' ? 'Hidden Gems' : 'Trésors Cachés'}
        items={suggestions.hiddenGems}
        type="gems"
      />

      <ResultSection
        title={language === 'en' ? 'Restaurants' : 'Restaurants'}
        items={suggestions.restaurants}
        type="restaurants"
      />

      <ResultSection
        title={language === 'en' ? 'Day-by-Day Itinerary' : 'Itinéraire Jour par Jour'}
        items={suggestions.itinerary}
        type="itinerary"
      />

      {suggestions.events.length > 0 && (
        <ResultSection
          title={language === 'en' ? 'Events' : 'Événements'}
          items={suggestions.events}
          type="events"
        />
      )}

      <ResultSection
        title={language === 'en' ? 'Where to Stay' : 'Où Séjourner'}
        items={suggestions.accommodation}
        type="accommodation"
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? 'Practical Advice' : 'Conseils Pratiques'}
        </h2>
        <p className="text-description text-sm">
          {suggestions.practicalAdvice}
        </p>
      </div>
    </div>
  );
}