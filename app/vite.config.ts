import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Served from https://pilpel-dobby.github.io/shabbat-clocks-game/
export default defineConfig({
  base: '/shabbat-clocks-game/',
  plugins: [react()],
})
