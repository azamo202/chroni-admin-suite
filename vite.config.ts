import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  
  // إزالة console.log و debugger في بيئة الإنتاج فقط لضمان الأمان والسرعة
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  
  // إعدادات بناء النسخة النهائية (Production Build)
  build: {
    target: "esnext",
  },
}));
