import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to https://<USER>.github.io/<REPO>/, set base to '/<REPO>/'
// We auto-detect when running in GitHub Actions
const isCI = process.env.GITHUB_ACTIONS === 'true'
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = isCI && repo ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  }
})
