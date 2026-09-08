/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: "#9381FF",
          50: "#F8F7FF",
          100: "#F0EEFF",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#B8B8FF",
          500: "#9381FF",
          600: "#9381FF",
          700: "#7C5CE0",
          800: "#6346B8",
          900: "#4A3290",
        },
        emerald: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        ink: {
          DEFAULT: "#0f172a",
          50: "#F8F7FF",
          100: "#F0EEFF",
          200: "#E2E0ED",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};