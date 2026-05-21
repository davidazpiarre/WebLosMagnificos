import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index:       resolve(__dirname, 'index.html'),
                actividades: resolve(__dirname, 'actividades.html'),
                galeria:     resolve(__dirname, 'galeria.html'),
                blog:        resolve(__dirname, 'blog.html'),
                dashboard:   resolve(__dirname, 'dashboard.html'),
            }
        }
    }
});
