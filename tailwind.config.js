/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy/indigo surfaces. `ink` is the app's canvas and card stack:
        // darker = further back. Everything else sits on top of these.
        ink: {
          950: "#101230",
          900: "#171A3A",
          800: "#1F2347",
          700: "#242850",
          600: "#2E3363",
          500: "#3A4079",
        },
        // Violet: primary AI interaction. Buttons, active nav, focus.
        brand: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        // Cyan: live/technology states only (streaming, scanning, detecting).
        tech: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
        },
        // Magenta: sparing emphasis. Never a surface.
        accent: {
          400: "#F472B6",
          500: "#EC4899",
        },
        blue: { 500: "#3B82F6" },
        success: { 400: "#4ADE80", 500: "#22C55E", 600: "#16A34A" },
        warn: { 400: "#FBBF24", 500: "#F59E0B" },
        danger: { 400: "#F87171", 500: "#EF4444" },
        lavender: "#EDE9FE",
        paper: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.28), 0 8px 24px -12px rgba(0,0,0,.5)",
        lift: "0 12px 32px -12px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)",
        glow: "0 0 32px -6px rgba(139,92,246,.45)",
        "glow-tech": "0 0 28px -6px rgba(34,211,238,.45)",
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
