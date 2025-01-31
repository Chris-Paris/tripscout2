import { useEffect, useRef } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';

interface PlacesAutocompleteProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
}

export function PlacesAutocomplete({ register, setValue }: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return;

    // Cleanup previous instance if it exists
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    // Initialize the autocomplete instance
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['geometry.location', 'formatted_address', 'place_id']
    });

    autocompleteRef.current = autocomplete;

    // Add listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.name) {
        setValue('destination', place.name);
      }
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [setValue]);

  // Register the input with react-hook-form
  const { ref, ...rest } = register('destination');

  return (
    <input
      {...rest}
      ref={(e) => {
        ref(e);
        inputRef.current = e;
      }}
      className="w-full p-2 border rounded-md"
      placeholder="Enter destination"
    />
  );
}