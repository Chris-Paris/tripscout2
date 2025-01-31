interface HeaderProps {
  language: 'en' | 'fr';
  onLanguageChange: (lang: 'en' | 'fr') => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <header className="border-b bg-white mb-5">
      <div className="container max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#780000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
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