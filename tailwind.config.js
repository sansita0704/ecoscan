/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Dark surfaces used by the camera and map views.
        ink: {
          950: "#17231E",
          900: "#22312A",
          800: "#2B3B33",
          700: "#3B4B43",
          600: "#52635A",
          500: "#718178",
        },
        surface: {
          50: "#FFFFFF",
          100: "#F8FAFC",
          200: "#F1F5F9",
          300: "#E8EFF7",
          400: "#DDE6F0",
        },
        // Muted green: primary product interaction.
        brand: {
          50: "#F1F7F2",
          100: "#E4F0E7",
          200: "#C9DECF",
          300: "#A7C7B0",
          400: "#82B096",
          500: "#5E9674",
          600: "#477A5C",
          700: "#356046",
        },
        // Blue is reserved for live/technology states.
        tech: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
        },
        // Warm terracotta for small accents only.
        accent: {
          50: "#FEF4F0",
          100: "#FCE5DC",
          200: "#F8CABA",
          400: "#E5A083",
          500: "#D27C5C",
        },
        blue: { 500: "#3B82F6" },
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
        },
        warn: { 200: "#FDE68A", 400: "#FBBF24", 500: "#F59E0B" },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
        lavender: "#EDE9FE",
        paper: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem", "3xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(21,35,28,0.04), 0 8px 24px -12px rgba(21,35,28,0.18)",
        lift: "0 16px 30px -14px rgba(21,35,28,0.24)",
        glow: "0 8px 18px -10px rgba(71,122,92,0.45)",
        "glow-tech": "0 8px 18px -10px rgba(59,130,246,0.45)",
      },
      keyframes: {
        // Scanner sweep across the camera feed.
        scanline: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "12%,88%": { opacity: "1" },
          "100%": { transform: "translateY(2400%)", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(.94)" },
          "100%": { opacity: "1", transform: "none" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-ring": {
          "0%": { transform: "scale(.85)", opacity: ".7" },
          "70%,100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        scanline: "scanline 2.8s cubic-bezier(.4,0,.6,1) infinite",
        "fade-up": "fade-up .32s cubic-bezier(.16,1,.3,1) both",
        "fade-in": "fade-in .25s ease-out both",
        "pop-in": "pop-in .28s cubic-bezier(.16,1,.3,1) both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0,0,.2,1) infinite",
      },
    },
  },
  plugins: [],
};
