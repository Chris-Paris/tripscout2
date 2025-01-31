export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TravelSuggestion {
  title: string;
  description: string;
  details?: string;
  location?: string;
  coordinates?: Coordinates;
  price?: string;
  rating?: number;
  imageUrl?: string;
}

export interface TravelSuggestions {
  destination: {
    name: string;
    coordinates: Coordinates;
  };
  mustSeeAttractions: TravelSuggestion[];
  hiddenGems: TravelSuggestion[];
  restaurants: TravelSuggestion[];
  itinerary: { day: number; activities: string[] }[];
  events: TravelSuggestion[];
  practicalAdvice: string;
  accommodation: TravelSuggestion[];
}