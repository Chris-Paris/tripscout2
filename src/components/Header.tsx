import { Languages } from 'lucide-react';

interface HeaderProps {
  language: 'en' | 'fr';
  onLanguageChange: (lang: 'en' | 'fr') => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <header className="border-b bg-white mb-5">
      <div className="container max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center">
          <Languages className="mr-2" />
          <h1 className="text-xl font-bold text-[#780000]">TripScout</h1>
        </div>
        <button
          onClick={() => {
            const newLang = language === 'en' ? 'fr' : 'en';
            onLanguageChange(newLang);
            const url = new URL(window.location.href);
            url.searchParams.set('lang', newLang);
            window.history.pushState({}, '', url);
          }}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
    </header>
  );
}