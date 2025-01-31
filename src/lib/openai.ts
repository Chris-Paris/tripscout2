import OpenAI from 'openai';
import { TravelSuggestions } from '@/types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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

const processAttraction = (attraction: {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}) => {
  // Add any necessary processing for attractions here
  return attraction;
};

const processGem = (gem: {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}) => {
  // Add any necessary processing for gems here
  return gem;
};

const processActivity = (activity: {
  title: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}) => {
  // Add any necessary processing for activities here
  return activity;
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

export const generateMoreAttractions = async ({
  destination,
  interests,
  language = 'en',
  existingAttractions
}: {
  destination: string;
  interests: string[];
  language?: 'en' | 'fr';
  existingAttractions: string[];
}) => {
  try {
    const systemPrompt = `You are a travel assistant that MUST respond with ONLY a valid JSON object containing an 'attractions' array, no other text. Follow these rules:
1. Response must be a JSON object with a single 'attractions' key containing an array of exactly 5 NEW attractions
2. Each attraction must be highly relevant to the user's interests: ${interests.join(', ')}
3. Do not include any explanatory text before or after the JSON
4. Each attraction object must follow this exact structure:
{
  "title": "Attraction Name",
  "description": "Detailed description of the attraction",
  "location": "Address or area",
  "coordinates": {
    "lat": 12.3456,
    "lng": 78.9012
  }
}
5. ${language === 'fr' ? 'ALL text content MUST be in French' : 'All content should be in English'}
6. Ensure coordinates are as accurate as possible
7. Focus on unique and interesting attractions that match the user's interests
8. Response format must be exactly:
{
  "attractions": [
    { attraction1 },
    { attraction2 },
    ...
  ]
}`;

    const attractions = existingAttractions.map((attraction: string) => `- ${attraction}`).join('\n');
    const userPrompt = language === 'fr'
      ? `Générez 5 nouvelles attractions pour ${destination} qui correspondent aux intérêts suivants: ${interests.join(', ')}. Ne pas inclure ces attractions existantes:\n${attractions}. REPONDEZ UNIQUEMENT AVEC UN OBJET JSON CONTENANT UN TABLEAU 'attractions'.`
      : `Generate 5 new attractions for ${destination} that match these interests: ${interests.join(', ')}. Do not include these existing attractions:\n${attractions}. RESPOND ONLY WITH A JSON OBJECT CONTAINING AN 'attractions' ARRAY.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      response_format: { type: "json_object" },
      stream: false
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const parsedContent: { attractions: { title: string; description: string; location: string; coordinates: { lat: number; lng: number } }[] } = JSON.parse(content);
      if (!parsedContent.attractions || !Array.isArray(parsedContent.attractions) || parsedContent.attractions.length !== 5) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Invalid response format: expected object with attractions array of 5 items');
      }
      
      // Validate each attraction
      parsedContent.attractions.forEach(attraction => {
        if (!attraction.title || !attraction.description || !attraction.location || 
            !attraction.coordinates?.lat || !attraction.coordinates?.lng) {
          console.error('Invalid attraction format:', attraction);
          throw new Error('Invalid attraction format');
        }
      });

      return parsedContent.attractions.map(processAttraction);
    } catch (e: unknown) {
      console.error('JSON parsing error:', e, '\nContent:', content);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error: unknown) {
    console.error('Error generating more attractions:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more attractions: ${error.message}`);
    }
    throw new Error('Failed to generate more attractions');
  }
};

export const generateMoreHiddenGems = async ({
  destination,
  interests,
  language = 'en',
  existingGems
}: {
  destination: string;
  interests: string[];
  language?: 'en' | 'fr';
  existingGems: string[];
}) => {
  try {
    const systemPrompt = `You are a travel assistant that MUST respond with ONLY a valid JSON object containing a 'hiddenGems' array, no other text. Follow these rules:
1. Response must be a JSON object with a single 'hiddenGems' key containing an array of exactly 5 NEW hidden gems
2. Each hidden gem must be:
   - Highly relevant to the user's interests: ${interests.join(', ')}
   - Less known or off the beaten path
   - Unique and authentic to the local culture
   - Not commonly found in standard tourist guides
3. Do not include any explanatory text before or after the JSON
4. Each hidden gem object must follow this exact structure:
{
  "title": "Hidden Gem Name",
  "description": "Detailed description emphasizing why it's special and unique",
  "location": "Address or area",
  "coordinates": {
    "lat": 12.3456,
    "lng": 78.9012
  }
}
5. ${language === 'fr' ? 'ALL text content MUST be in French' : 'All content should be in English'}
6. Ensure coordinates are as accurate as possible
7. Response format must be exactly:
{
  "hiddenGems": [
    { gem1 },
    { gem2 },
    ...
  ]
}`;

    const gems = existingGems.map((gem: string) => `- ${gem}`).join('\n');
    const userPrompt = language === 'fr'
      ? `Générez 5 nouveaux trésors cachés pour ${destination} qui correspondent aux intérêts suivants: ${interests.join(', ')}. Ces lieux doivent être authentiques et hors des sentiers battus. Ne pas inclure ces lieux existants:\n${gems}. REPONDEZ UNIQUEMENT AVEC UN OBJET JSON CONTENANT UN TABLEAU 'hiddenGems'.`
      : `Generate 5 new hidden gems for ${destination} that match these interests: ${interests.join(', ')}. These places should be authentic and off the beaten path. Do not include these existing places:\n${gems}. RESPOND ONLY WITH A JSON OBJECT CONTAINING A 'hiddenGems' ARRAY.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      response_format: { type: "json_object" },
      stream: false
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const parsedContent: { hiddenGems: { title: string; description: string; location: string; coordinates: { lat: number; lng: number } }[] } = JSON.parse(content);
      if (!parsedContent.hiddenGems || !Array.isArray(parsedContent.hiddenGems) || parsedContent.hiddenGems.length !== 5) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Invalid response format: expected object with hiddenGems array of 5 items');
      }
      
      // Validate each hidden gem
      parsedContent.hiddenGems.forEach(gem => {
        if (!gem.title || !gem.description || !gem.location || 
            !gem.coordinates?.lat || !gem.coordinates?.lng) {
          console.error('Invalid hidden gem format:', gem);
          throw new Error('Invalid hidden gem format');
        }
      });

      return parsedContent.hiddenGems.map(processGem);
    } catch (e: unknown) {
      console.error('JSON parsing error:', e, '\nContent:', content);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error: unknown) {
    console.error('Error generating more hidden gems:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more hidden gems: ${error.message}`);
    }
    throw new Error('Failed to generate more hidden gems');
  }
};

export const generateMoreActivities = async ({
  destination,
  interests,
  language = 'en',
  existingActivities
}: {
  destination: string;
  interests: string[];
  language?: 'en' | 'fr';
  existingActivities: string[];
}) => {
  try {
    const systemPrompt = `You are a travel assistant that MUST respond with ONLY a valid JSON object containing an 'activities' array, no other text. Follow these rules:
1. Response must be a JSON object with a single 'activities' key containing an array of exactly 5 NEW activity suggestions
2. Each activity must be:
   - Highly relevant to the user's interests: ${interests.join(', ')}
   - Specific and actionable
   - Include timing information
   - Include location or venue when applicable
3. Do not include any explanatory text before or after the JSON
4. Each activity object must follow this exact structure:
{
  "title": "Activity Name",
  "description": "Detailed description of what to do and what to expect",
  "timing": "${language === 'fr' ? 'Durée suggérée: 2-3 heures' : 'Suggested duration: 2-3 hours'}",
  "location": "Where to do this activity",
  "coordinates": {
    "lat": 12.3456,
    "lng": 78.9012
  },
  "bestTimeOfDay": "${language === 'fr' ? 'Matin' : 'Morning'}"
}
5. ${language === 'fr' ? 'ALL text content MUST be in French' : 'All content should be in English'}
6. Ensure coordinates are as accurate as possible for location-specific activities
7. Do not repeat any of these existing activities: ${existingActivities.join(', ')}
8. Response format must be exactly:
{
  "activities": [
    { activity1 },
    { activity2 },
    ...
  ]
}`;

    const activities = existingActivities.map((activity: string) => `- ${activity}`).join('\n');
    const userPrompt = language === 'fr'
      ? `Générez 5 nouvelles suggestions d'activités pour ${destination} qui correspondent aux intérêts suivants: ${interests.join(', ')}. Ces activités doivent être uniques et ne pas inclure:\n${activities}. REPONDEZ UNIQUEMENT AVEC UN OBJET JSON CONTENANT UN TABLEAU 'activities'.`
      : `Generate 5 new activity suggestions for ${destination} that match these interests: ${interests.join(', ')}. These activities should be unique and not include:\n${activities}. RESPOND ONLY WITH A JSON OBJECT CONTAINING AN 'activities' ARRAY.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      response_format: { type: "json_object" },
      stream: false
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const parsedContent: { activities: { title: string; description: string; timing: string; location: string; coordinates: { lat: number; lng: number }; bestTimeOfDay: string }[] } = JSON.parse(content);
      if (!parsedContent.activities || !Array.isArray(parsedContent.activities) || parsedContent.activities.length !== 5) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Invalid response format: expected object with activities array of 5 items');
      }
      
      // Validate each activity
      parsedContent.activities.forEach(activity => {
        if (!activity.title || !activity.description || !activity.timing || 
            !activity.location || !activity.coordinates?.lat || !activity.coordinates?.lng) {
          console.error('Invalid activity format:', activity);
          throw new Error('Invalid activity format');
        }
      });

      return parsedContent.activities.map(processActivity);
    } catch (e: unknown) {
      console.error('JSON parsing error:', e, '\nContent:', content);
      if (e instanceof Error) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`);
      }
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error: unknown) {
    console.error('Error generating more activities:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate more activities: ${error.message}`);
    }
    throw new Error('Failed to generate more activities');
  }
};