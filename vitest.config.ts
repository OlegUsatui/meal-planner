import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/testing/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
    clearMocks: true,
    restoreMocks: true,
  },
})
