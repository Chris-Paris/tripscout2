import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
// Replace 'YOUR_PROJECT_TOKEN' with your actual Mixpanel project token
mixpanel.init('506b88238a64b71eb0defdb84d035c2a', {
  debug: import.meta.env.DEV,
  track_pageview: true,
  persistence: 'localStorage',
});

// Analytics events
export const analytics = {
  // Track page views
  trackPageView: (pageName: string) => {
    mixpanel.track('Page View', { page: pageName });
  },

  // Track form submissions
  trackTravelPlanGenerated: (destination: string, duration: number, interests: string[]) => {
    mixpanel.track('Travel Plan Generated', {
      destination,
      duration,
      interests,
    });
  },

  // Track language changes
  trackLanguageChange: (language: 'en' | 'fr') => {
    mixpanel.track('Language Changed', { language });
  },

  // Track when user views travel results
  trackViewTravelResults: (destination: string) => {
    mixpanel.track('View Travel Results', { destination });
  },

  // Track when user loads more activities/attractions
  trackLoadMore: (type: 'activities' | 'attractions' | 'hiddenGems', destination: string) => {
    mixpanel.track('Load More Content', { type, destination });
  },

  // Track when user resets the form
  trackReset: () => {
    mixpanel.track('Reset Form');
  },

  // Identify user (if you implement user authentication later)
  identifyUser: (userId: string, traits?: Record<string, any>) => {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  },
};
