import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Измени 'dm-tracker' на имя твоего GitHub репозитория
export default defineConfig({
  plugins: [react()],
  base: '/combat_tracker/',
})
