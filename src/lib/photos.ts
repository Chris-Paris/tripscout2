import { Coordinates } from '@/types';

interface PlacePhoto {
  getUrl: (options?: { maxWidth?: number }) => string;
}

interface PlaceResult {
  photos?: PlacePhoto[];
  place_id?: string;
}

interface PlaceDetails {
  photos?: PlacePhoto[];
}

export async function getPlacePhotos(coordinates: Coordinates): Promise<string[]> {
  try {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      location: new google.maps.LatLng(coordinates.lat, coordinates.lng),
      radius: 500,
      type: 'tourist_attraction'
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const photos: string[] = [];
          
          for (const result of results) {
            if (result.photos) {
              photos.push(...result.photos.map(photo => photo.getUrl({ maxWidth: 800 })));
            }
          }
          
          resolve(photos.slice(0, 5)); // Limit to 5 photos
        } else {
          reject(new Error('Failed to fetch nearby places'));
        }
      });
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

export async function getLocationPhotos(location: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      query: location,
      fields: ['photos', 'place_id']
    };

    service.findPlaceFromQuery(request, (results: PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const placeResult = results[0];
        
        if (placeResult.photos) {
          resolve(placeResult.photos.map(photo => photo.getUrl({ maxWidth: 800 })));
        } else if (placeResult.place_id) {
          service.getDetails(
            { placeId: placeResult.place_id, fields: ['photos'] },
            (place: PlaceDetails | null, status: google.maps.places.PlacesServiceStatus) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                if (place.photos) {
                  resolve(place.photos.map(photo => photo.getUrl({ maxWidth: 800 })));
                } else {
                  resolve([]);
                }
              } else {
                reject(new Error('Failed to get place details'));
              }
            }
          );
        } else {
          resolve([]);
        }
      } else {
        reject(new Error('Place not found'));
      }
    });
  });
}