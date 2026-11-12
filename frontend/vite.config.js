import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'icons': ['lucide-react'],
				},
			},
		},
	},
	server: {
		proxy: {
			'/api': 'http://localhost:5000',
		},
	},
	preview: {
		proxy: {
			'/api': 'http://localhost:5000',
		},
	},
});
