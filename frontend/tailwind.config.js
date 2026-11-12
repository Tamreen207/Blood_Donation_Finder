/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 80px rgba(244, 63, 94, 0.25)',
      },
      backgroundImage: {
        'blood-radial': 'radial-gradient(circle at top, rgba(244,63,94,0.25), transparent 38%), radial-gradient(circle at right, rgba(14,165,233,0.15), transparent 30%), linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 100%)',
      },
    },
  },
  plugins: [],
};