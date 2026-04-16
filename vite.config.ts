/// <reference types="vitest/config" />

import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import compression from "vite-plugin-compression";

export default defineConfig(async ({ mode }) => {
  const isPages = mode === "pages";

  return {
    base: isPages ? "/sqlite-online/" : "/",
    plugins: [
      react(),
      await babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      compression()
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              return id.toString().split("node_modules/")[1]?.split("/")[0];
            }

            return undefined;
          }
        }
      }
    },
    optimizeDeps: {
      exclude: [
        "react-window",
        "react-virtualized-auto-sizer",
        "react-resizable-panels"
      ]
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname), path.resolve(__dirname, "..")],
        strict: false
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      clearMocks: true,
      restoreMocks: true
    }
  };
});
