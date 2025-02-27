/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-dot-1": {
          "0%": { transform: "scale(0.95) translate(0px, 0px)", opacity: "0.6" },
          "20%": { transform: "scale(1) translate(15px, -12px)", opacity: "0.8" },
          "40%": { transform: "scale(0.98) translate(8px, -20px)", opacity: "0.7" },
          "60%": { transform: "scale(1.02) translate(-12px, -16px)", opacity: "0.85" },
          "80%": { transform: "scale(0.96) translate(-18px, -5px)", opacity: "0.7" },
          "100%": { transform: "scale(0.95) translate(0px, 0px)", opacity: "0.6" },
        },
        "pulse-dot-2": {
          "0%": { transform: "scale(0.96) translate(0px, 0px)", opacity: "0.65" },
          "25%": { transform: "scale(1.01) translate(-20px, -8px)", opacity: "0.8" },
          "50%": { transform: "scale(0.98) translate(-12px, -22px)", opacity: "0.75" },
          "75%": { transform: "scale(1) translate(16px, -15px)", opacity: "0.85" },
          "100%": { transform: "scale(0.96) translate(0px, 0px)", opacity: "0.65" },
        },
        "pulse-dot-3": {
          "0%": { transform: "scale(0.97) translate(0px, 0px)", opacity: "0.7" },
          "30%": { transform: "scale(1.01) translate(18px, -18px)", opacity: "0.85" },
          "60%": { transform: "scale(0.99) translate(-15px, -12px)", opacity: "0.75" },
          "100%": { transform: "scale(0.97) translate(0px, 0px)", opacity: "0.7" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "0.3" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "road-line": {
          "0%": { strokeDashoffset: "20" },
          "100%": { strokeDashoffset: "0" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-dot-1": "pulse-dot-1 8s ease-in-out infinite",
        "pulse-dot-2": "pulse-dot-2 7.5s ease-in-out infinite",
        "pulse-dot-3": "pulse-dot-3 6.5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 3s ease-in-out infinite",
        "road-line": "road-line 1.5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 