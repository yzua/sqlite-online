import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

import react from "@vitejs/plugin-react";
import babelReactCompiler from "babel-plugin-react-compiler";
import { defineConfig } from "vite";
import compression from "vite-plugin-compression";

export default defineConfig(({ mode }) => {
  const isPages = mode === "pages";

  return {
    base: isPages ? "/sqlite-online/" : "/",
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
              return id.toString().split("node_modules/")[1]?.split("/")[0];
            }

            return undefined;
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
  };
});
