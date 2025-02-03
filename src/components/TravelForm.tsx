import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlacesAutocomplete } from './PlacesAutocomplete';
import { analytics } from '@/lib/analytics';

export type Interest = 'Culture' | 'Nature' | 'Food' | 'Shopping' | 'Adventure' | 'Relaxation' | 'History' | 'Art' | 'Couple Trip' | 'Family Trip' | 'Night Life';

const interestTranslations: Record<Interest, Record<'en' | 'fr', string>> = {
  Culture: { en: 'Culture', fr: 'Culture' },
  Nature: { en: 'Nature', fr: 'Nature' },
  Food: { en: 'Food', fr: 'Gastronomie' },
  Shopping: { en: 'Shopping', fr: 'Shopping' },
  Adventure: { en: 'Adventure', fr: 'Aventure' },
  Relaxation: { en: 'Relaxation', fr: 'Détente' },
  History: { en: 'History', fr: 'Histoire' },
  Art: { en: 'Art', fr: 'Art' },
  'Couple Trip': { en: 'Couple Trip', fr: 'Voyage en couple' },
  'Family Trip': { en: 'Family Trip', fr: 'Voyage en famille' },
  'Night Life': { en: 'Night Life', fr: 'Vie nocturne' }
};

const interests: Interest[] = ['Culture', 'Nature', 'Food', 'Shopping', 'Adventure', 'Relaxation', 'History', 'Art', 'Couple Trip', 'Family Trip', 'Night Life'];

interface TravelFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  language: 'en' | 'fr';
  onReset: () => void;
}

export const formSchema = z.object({
  destination: z.string().min(2, {
    message: 'Destination must be at least 2 characters.'
  }),
  date: z.date(),
  duration: z.number().min(1).max(30),
  interests: z.array(z.enum(['Culture', 'Nature', 'Food', 'Shopping', 'Adventure', 'Relaxation', 'History', 'Art', 'Couple Trip', 'Family Trip', 'Night Life']))
});

export type FormValues = z.infer<typeof formSchema>;

export function TravelForm({ onSubmit, isLoading, language, onReset }: TravelFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      date: new Date(),
      duration: 3,
      interests: []
    },
  });

  useEffect(() => {
    const currentInterests = form.getValues('interests');
    if (currentInterests.length > 0) {
      const translatedInterests = currentInterests
        .map(interest => {
          const index = interests.indexOf(interest as any);
          return index !== -1 ? interestTranslations[interest][language] : null;
        })
        .filter((interest): interest is Interest => interest !== null);

      if (translatedInterests.length > 0) {
        form.setValue('interests', translatedInterests);
      }
    }
  }, [language, form]);

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM format
      const label = date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    form.setValue('date', date);
  };

  const handleSubmit = async (data: FormValues) => {
    analytics.trackTravelPlanGenerated(
      data.destination,
      data.duration,
      data.interests
    );
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <h2 className="text-2xl font-semibold text-center">
        {language === 'en' 
          ? 'Plan your trip with AI in one click' 
          : 'Planifiez votre voyage avec l\'IA en un clic'}
      </h2>
      <div>
        <label className="block text-sm font-medium mb-2">
          {language === 'en' ? 'Destination' : 'Destination'}
        </label>
        <PlacesAutocomplete
          register={form.register}
          setValue={form.setValue}
        />
        {form.formState.errors.destination && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.destination.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'en' ? 'When' : 'Quand'}
          </label>
          <select
            className="w-full p-2 border rounded-md"
            onChange={handleMonthChange}
            defaultValue={monthOptions[0]?.value}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'en' ? 'Duration' : 'Durée'}
          </label>
          <select
            {...form.register('duration', { valueAsNumber: true })}
            className="w-full p-2 border rounded-md bg-background hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            defaultValue="7"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((days) => (
              <option key={days} value={days}>
                {days} {language === 'en' ? (days === 1 ? 'day' : 'days') : (days === 1 ? 'jour' : 'jours')}
              </option>
            ))}
          </select>
          {form.formState.errors.duration && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.duration.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-4">
          {language === 'en' ? 'Interests' : 'Centres d\'intérêt'}
        </label>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => {
            const inputId = `interest-${interest}`;
            return (
              <label
                key={interest}
                htmlFor={inputId}
                className={`inline-flex items-center cursor-pointer group`}
              >
                <input
                  type="checkbox"
                  id={inputId}
                  {...form.register('interests')}
                  value={interest}
                  className="sr-only peer"
                />
                <div className={`px-2 py-2 rounded-full border border-[#c1121f] bg-white text-[#c1121f]
                  peer-checked:bg-[#c1121f] peer-checked:text-white peer-checked:border-[#c1121f] 
                  hover:border-[#c1121f] hover:border-opacity-70 transition-colors`}>
                  {interestTranslations[interest][language]}
                </div>
              </label>
            );
          })}
        </div>
        {form.formState.errors.interests && (
          <p className="text-red-500 text-sm mt-2">
            {form.formState.errors.interests.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 md:px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex-1"
        >
          {isLoading ? (
            <span>{language === 'en' ? 'Generating...' : 'Génération...'}</span>
          ) : (
            <span>{language === 'en' ? 'Generate Travel Plan' : 'Générer le Plan de Voyage'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            form.reset();
            onReset();
          }}
          className="px-4 md:px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          {language === 'en' ? 'Reset' : 'Réinitialiser'}
        </button>
      </div>
    </form>
  );
}