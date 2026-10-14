/* Tailwind Play CDN configuration.
   Loaded AFTER the Tailwind CDN script and BEFORE the page renders. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#0E1F1C',
        mist: '#F3F6F4',
        lichen: '#DCE7E0',
        pine: {
          DEFAULT: '#14463C',
          dark: '#0C2E27',
          light: '#1E6152'
        },
        brass: {
          DEFAULT: '#C99A3A',
          deep: '#8A6416'
        }
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,31,28,.06), 0 8px 24px -12px rgba(14,31,28,.18)',
        lift: '0 2px 4px rgba(14,31,28,.06), 0 24px 40px -18px rgba(14,31,28,.30)'
      }
    }
  }
};
