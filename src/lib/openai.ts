import OpenAI from 'openai';
import { TravelSuggestions } from '@/types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Attraction {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

interface Activity {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

interface Gem {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

const validateResponse = (data: any): data is TravelSuggestions => {
  if (!data || typeof data !== 'object') {
    console.error('Invalid response: not an object', data);
    return false;
  }

  if (!data.destination?.coordinates?.lat || !data.destination?.coordinates?.lng) {
    console.error('Invalid response: missing destination coordinates', data.destination);
    return false;
  }

  // Required arrays that must be present
  const requiredArrays = ['mustSeeAttractions', 'hiddenGems', 'restaurants', 'itinerary', 'accommodation'];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      console.error(`Invalid response: ${key} is not an array`, data[key]);
      return false;
    }
  }

  // Events array is optional, but if present must be an array
  if (data.events && !Array.isArray(data.events)) {
    console.error('Invalid response: events is present but not an array', data.events);
    return false;
  }

  // If events is not present, initialize it as an empty array
  if (!data.events) {
    data.events = [];
  }

  if (typeof data.practicalAdvice !== 'string') {
    console.error('Invalid response: practicalAdvice is not a string', data.practicalAdvice);
    return false;
  }

  return true;
};

export const generateTravelPlan = async ({
  destination,
  date,
  duration,
  interests,
  language = 'en'
}: {
  destination: string;
  date: Date;
  duration: number;
  interests: string[];
  language?: 'en' | 'fr';
}) => {
  try {
    const systemPrompt = `You are a travel assistant that MUST respond with ONLY a valid JSON object, no other text. Follow these rules:
1. Response must be a single JSON object
2. Do not include any explanatory text before or after the JSON
3. All string values must be properly escaped
4. CRITICAL: All recommendations MUST be highly relevant to the user's ${interests.join(', ')}
5. For each section, provide at least:
   - 5 must-see attractions related to that interest
   - 5 hidden gems related to that interest
   - 3 restaurants that match the interest (especially for Food & Dining)
6. CRITICAL: The itinerary MUST:
   - Include exactly ${duration} days
   - Have exactly 3 activities per day (morning, afternoon, evening)
   - Group activities by interest when possible
   - Include specific times for each activity
   - Reference the recommended attractions, gems, and restaurants
7. Provide at least 3 different relevant districts or areas where to stay, considering the selected interests
8. MUST include accurate coordinates (latitude and longitude) for the destination and all locations
9. ${language === 'fr' ? 'CRITICAL: ALL text content MUST be in French, including descriptions, activities, and advice' : 'All content should be in English'}
10. For itinerary activities, ${language === 'fr' ? 'use French time periods ("Matin: 9h00", "Après-midi: 14h00", "Soir: 19h00")' : 'use English time periods ("Morning: 9:00 AM", "Afternoon: 2:00 PM", "Evening: 7:00 PM")'} 
11. When suggesting restaurants, prioritize:
    - Local cuisine for "Food & Dining"
    - Family-friendly options for "Family Activities"
    - Atmospheric venues for "Culture & History"
    - Quick service for "Adventure" activities
12. For accommodation recommendations:
    - Consider proximity to attractions matching interests
    - Suggest areas with relevant amenities (e.g., nightlife districts for "Nightlife" interest)
13. Use the exact structure below:

{
  "destination": {
    "name": "City Name",
    "coordinates": {
      "lat": 12.3456,
      "lng": 78.9012
    }
  },
  "mustSeeAttractions": [
    {
      "title": "Example Attraction",
      "description": "Description of the attraction",
      "location": "Address or area",
      "coordinates": {
        "lat": 12.3456,
        "lng": 78.9012
      }
    }
  ],
  "hiddenGems": [
    {
      "title": "Hidden Spot",
      "description": "Why it's special",
      "location": "Where to find it",
      "coordinates": {
        "lat": 12.3456,
        "lng": 78.9012
      }
    }
  ],
  "restaurants": [
    {
      "title": "Restaurant Name",
      "description": "Type of cuisine and atmosphere",
      "location": "Address",
      "coordinates": {
        "lat": 12.3456,
        "lng": 78.9012
      },
      "price": "${language === 'fr' ? '€€€' : '$$$'}",
      "rating": 4.5
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "activities": [
        "${language === 'fr' ? 'Matin: 9h00 - Visite de X' : 'Morning: 9:00 AM - Visit X'}",
        "${language === 'fr' ? 'Après-midi: 14h00 - Explorer Y' : 'Afternoon: 2:00 PM - Explore Y'}",
        "${language === 'fr' ? 'Soir: 19h00 - Dîner à Z' : 'Evening: 7:00 PM - Dinner at Z'}"
      ]
    }
  ],
  "events": [
    {
      "title": "Event Name",
      "description": "What's happening",
      "date": "Event date or timing",
      "location": "Event location",
      "coordinates": {
        "lat": 12.3456,
        "lng": 78.9012
      }
    }
  ],
  "practicalAdvice": "Important tips and information about the destination such as available transportation, weather",
  "accommodation": [
    {
      "title": "District Name",
      "description": "District details",
      "location": "Area",
      "coordinates": {
        "lat": 12.3456,
        "lng": 78.9012
      }
    }
  ]
}`;

    const userPrompt = language === 'fr'
      ? `Générez un plan de voyage détaillé pour ${destination}, ${duration} jour(s)) qui se concentre spécifiquement sur les intérêts suivants: ${interests.join(', ')}, à partir du ${date.toLocaleDateString('fr-FR')}. IMPORTANT: Les recommandations doivent être fortement liées aux intérêts sélectionnés. Répondez UNIQUEMENT avec un objet JSON valide qui suit exactement la structure fournie, sans texte supplémentaire. Incluez les coordonnées précises pour toutes les locations. TOUT LE CONTENU DOIT ÊTRE EN FRANÇAIS.`
      : `Generate a detailed travel plan for ${destination}, ${duration} day(s)) that specifically focuses on the following interests: ${interests.join(', ')}, starting from ${date.toLocaleDateString('en-US')}. IMPORTANT: Recommendations must be strongly tied to the selected interests. Respond ONLY with a valid JSON object that exactly follows the provided structure, no additional text. Include accurate coordinates for all locations.`;

    console.log('Sending request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      stream: false
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response:', completion);
      throw new Error('No content received from OpenAI');
    }

    console.log('Received response from OpenAI, parsing JSON...');
    console.log('Raw response:', content.slice(0, 200) + '...'); // Log first 200 chars for debugging

    try {
      // Remove any potential whitespace or special characters at the start and end
      const trimmedContent = content.trim();
      
      // Try to parse the JSON
      let parsedContent: TravelSuggestions;
      try {
        parsedContent = JSON.parse(trimmedContent);
      } catch (e: unknown) {
        console.error('Error parsing JSON:', e);
        if (e instanceof Error) {
          throw new Error(`Failed to parse OpenAI response: ${e.message}`);
        }
        throw new Error('Failed to parse OpenAI response');
      }

      console.log('Successfully parsed JSON response');
      
      if (!validateResponse(parsedContent)) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('OpenAI response does not match expected format');
      }

      console.log('Response validation successful');
      return parsedContent;
    } catch (e: unknown) {
      console.error('Error generating travel plan:', e);
      if (e instanceof Error) {
        throw new Error(`Failed to generate travel plan: ${e.message}`);
      }
      throw new Error('Failed to generate travel plan');
    }
  } catch (error: unknown) {
    console.error('Error generating travel plan:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate travel plan: ${error.message}`);
    }
    throw new Error('Failed to generate travel plan');
  }
};

export const generateMoreAttractions = async (destination: string): Promise<Attraction[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful travel assistant." },
        { role: "user", content: `Generate more attractions for ${destination} in JSON format.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsedContent = JSON.parse(content);
      return parsedContent.attractions.map((attraction: Attraction) => ({
        title: attraction.title,
        description: attraction.description,
        location: attraction.location,
        coordinates: attraction.coordinates
      }));
    } catch (e: unknown) {
      console.error('Error parsing JSON:', e);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error: unknown) {
    console.error('Error generating more attractions:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more attractions: ${error.message}`);
    }
    throw new Error('Failed to generate more attractions');
  }
};

export const generateMoreHiddenGems = async (destination: string): Promise<Gem[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful travel assistant." },
        { role: "user", content: `Generate more hidden gems for ${destination} in JSON format.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsedContent = JSON.parse(content);
      return parsedContent.hiddenGems.map((gem: Gem) => ({
        title: gem.title,
        description: gem.description,
        location: gem.location,
        coordinates: gem.coordinates
      }));
    } catch (e: unknown) {
      console.error('Error parsing JSON:', e);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error: unknown) {
    console.error('Error generating more hidden gems:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more hidden gems: ${error.message}`);
    }
    throw new Error('Failed to generate more hidden gems');
  }
};

export const generateMoreActivities = async (destination: string): Promise<Activity[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful travel assistant." },
        { role: "user", content: `Generate more activities for ${destination} in JSON format.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsedContent = JSON.parse(content);
      return parsedContent.activities.map((activity: Activity) => ({
        title: activity.title,
        description: activity.description,
        location: activity.location,
        coordinates: activity.coordinates
      }));
    } catch (e: unknown) {
      console.error('Error parsing JSON:', e);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error: unknown) {
    console.error('Error generating more activities:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more activities: ${error.message}`);
    }
    throw new Error('Failed to generate more activities');
  }
};