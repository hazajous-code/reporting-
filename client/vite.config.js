import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** GitHub Pages project URL is /{repo-name}/ — CI sets GITHUB_REPOSITORY; optional override VITE_PAGES_BASE=/my-repo/ */
function resolveBase() {
  if (process.env.GITHUB_PAGES !== 'true') return '/';
  const explicit = process.env.VITE_PAGES_BASE?.trim();
  if (explicit) {
    const withLead = explicit.startsWith('/') ? explicit : `/${explicit}`;
    return withLead.endsWith('/') ? withLead : `${withLead}/`;
  }
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repo) return `/${repo}/`;
  return '/reporting-/';
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: resolveBase(),
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
