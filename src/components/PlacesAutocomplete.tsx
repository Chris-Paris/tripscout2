import { useEffect, useRef } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { FormValues } from './TravelForm';

interface PlacesAutocompleteProps {
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

export function PlacesAutocomplete({
  register,
  setValue,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['formatted_address', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValue('destination', place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [setValue]);

  return (
    <input
      type="text"
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...register('destination')}
      ref={(e) => {
        inputRef.current = e;
        const { ref } = register('destination');
        if (typeof ref === 'function') {
          ref(e);
        }
      }}
    />
  );
}