import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['@arcgis/core']
	},
	build: {
		chunkSizeWarningLimit: 1600
	}
});
