/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./web/index.html", "./web/src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a09",
        surface: "#121210",
        raised: "#1a1a16",
        line: "#2b2b24",
        paper: "#e9e5db",
        muted: "#9c978b",
        faint: "#6d695f",
        brass: "#c4a15c",
        brassbright: "#e0c383",
        good: "#8fbf8a",
        bad: "#d08b7a",
      },
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
