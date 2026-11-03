import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://landscape82.github.io",
  base: "/awesome-sound-design-resources",
  vite: {
    server: { fs: { allow: [".."] } },
  },
});
