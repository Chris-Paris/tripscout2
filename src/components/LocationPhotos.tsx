import { useState, useEffect } from 'react';
import { getPlacePhotos, getLocationPhotos } from '@/lib/photos';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LocationPhotosProps {
  location: string;
  coordinates?: { lat: number; lng: number };
}

export function LocationPhotos({ location, coordinates }: LocationPhotosProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        if (coordinates) {
          const placePhotos = await getPlacePhotos(coordinates);
          setPhotos(placePhotos);
        } else {
          const locationPhotos = await getLocationPhotos(location);
          setPhotos(locationPhotos);
        }
      } catch (err) {
        console.error('Failed to load photos:', err);
        setPhotos([]);
      }
    }

    if (location || coordinates) {
      fetchPhotos();
    }
  }, [location, coordinates]);

  if (photos.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span>
          {isExpanded
            ? 'Hide Photos'
            : 'View Photos'}
        </span>
      </button>

      {isExpanded && photos.length > 0 && (
        <div className="mt-4">
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {photos.map((url, index) => (
              <div 
                key={`desktop-${index}`}
                className="relative aspect-[4/3] h-48 overflow-hidden rounded-lg"
              >
                <img
                  src={url}
                  alt={`${location} - Photo ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden w-screen relative left-1/2 -translate-x-1/2">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
              {photos.map((url, index) => (
                <div 
                  key={`mobile-${index}`}
                  className="flex-none w-[90vw] px-2 first:pl-4 last:pr-4 snap-center"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img
                      src={url}
                      alt={`${location} - Photo ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}