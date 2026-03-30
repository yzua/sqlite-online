import path from "node:path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from "vite-plugin-compression";
import babelReactCompiler from "babel-plugin-react-compiler";

export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages';

  return {
    base: isPages ? '/sqlite-online/' : '/',
    plugins: [
      react({
        babel: {
          plugins: [babelReactCompiler]
        }
      }),
      tailwindcss(),
      compression()
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          }
        }
      }
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
    }
  }
})
