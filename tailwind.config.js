/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./web/index.html", "./web/src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        ink: "#161412",
        surface: "#1e1c19",
        raised: "#292623",
        line: "#3a3630",
        strong: "#4d473f",
        paper: "#ece6dc",
        muted: "#a59d90",
        faint: "#7d7568",
        brass: "#e06c2f",
        brassbright: "#f08c4f",
        good: "#8a9a5b",
        bad: "#c14b3a",
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "'Liberation Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
