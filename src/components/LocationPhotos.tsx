import { useState, useEffect } from 'react';
import { getPlacePhotos, getLocationPhotos } from '@/lib/photos';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LocationPhotosProps {
  location: string;
  coordinates?: { lat: number; lng: number };
  language: string;
}

export function LocationPhotos({ location, coordinates, language }: LocationPhotosProps) {
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

    fetchPhotos();
  }, [location, coordinates]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      {photos.length > 0 && (
        <div>
          <button
            onClick={toggleExpanded}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <span className="mr-1">
              {isExpanded ? (language === 'fr' ? 'Masquer les photos' : 'Hide Photos') : (language === 'fr' ? 'Voir les photos' : 'View Photos')}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-2 flex flex-row gap-2 overflow-x-auto scrollbar-hide">
              {photos.slice(0, 4).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${location} photo ${index + 1}`}
                  className="w-48 h-48 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}