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
        paper: "#f5f0e8",
        muted: "#c4bdb0",
        faint: "#a09888",
        brass: "#e06c2f",
        brassbright: "#f08c4f",
        good: "#8a9a5b",
        bad: "#c14b3a",
      },
      fontFamily: {
        display: ["'Berkeley Mono'", "'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "'Liberation Mono'", "'Courier New'", "monospace"],
        sans: ["'Berkeley Mono'", "'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "'Liberation Mono'", "'Courier New'", "monospace"],
        mono: ["'Berkeley Mono'", "'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "'Liberation Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
