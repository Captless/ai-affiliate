import { build, context } from "esbuild";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");

const commonOptions = {
  entryPoints: [path.join(root, "web", "src", "app.ts")],
  bundle: true,
  outfile: path.join(root, "web", "dist", "app.js"),
  sourcemap: true,
  target: "es2020",
  logLevel: "info",
};

if (watch) {
  const ctx = await context({
    ...commonOptions,
    plugins: [
      {
        name: "rebuild-log",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length) console.error("[app.js] build failed");
            else console.log("[app.js] rebuilt");
          });
        },
      },
    ],
  });
  await ctx.watch();
} else {
  await build(commonOptions);
}

const tailwindCli = path.join(root, "node_modules", "tailwindcss", "lib", "cli.js");
const tailwind = spawn(
  process.execPath,
  [
    tailwindCli,
    "-c",
    path.join(root, "tailwind.config.js"),
    "-i",
    path.join(root, "web", "src", "styles.css"),
    "-o",
    path.join(root, "web", "dist", "styles.css"),
    "--minify",
    ...(watch ? ["--watch"] : []),
  ],
  { stdio: "inherit" }
);

if (!watch) {
  await new Promise((resolve) => tailwind.on("exit", resolve));
}
