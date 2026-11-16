/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: '#F7F7F5',
        surface: '#FFFFFF',
        'text-main': '#252A31',
        'text-muted': '#68717D',
        accent: {
          DEFAULT: '#315B83',
          hover: '#264969',
          light: '#EBF1F6',
          border: '#B8C9D8',
        },
        line: {
          DEFAULT: '#E3E5E8',
          subtle: '#EAECEF',
          strong: '#D0D4D9',
        },
        status: {
          success: '#2E7D32',
          'success-bg': '#F1F8F1',
          'success-border': '#C8E6C9',
          danger: '#C62828',
          'danger-bg': '#FDF2F2',
          'danger-border': '#FFCDD2',
          warning: '#ED6C02',
          'warning-bg': '#FFF8E1',
          'warning-border': '#FFE082',
        }
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
      }
    },
  },
  plugins: [],
}
