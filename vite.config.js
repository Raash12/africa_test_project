import path from "path"
import { fileURLToPath } from "url"
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    host: '127.0.0.1', // ✅ Waxay ku khasbaysaa nidaamka inuu isticmaalo IP toos ah halkii uu localhost dhihi lahaa
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      protocol: 'ws',     // ✅ Dejinta WebSocket ee Brave u baahan yahay
      host: '127.0.0.1',
      port: 5173,
      overlay: true,
    }
  }
}