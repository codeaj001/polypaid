import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const trailsInstalled = fs.existsSync(path.resolve(__dirname, 'node_modules', '0xtrails'));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 0xtrails isn't installed yet — point the widget import at a local
      // stub so the build still succeeds. See src/components/TrailsPayWidget.tsx.
      ...(!trailsInstalled ? { '0xtrails/widget': path.resolve(__dirname, 'src/lib/trails-widget-stub.ts') } : {}),
    },
  },
});
