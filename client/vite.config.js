import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            "@app": "/src",
            "@assets": "/src/assets",
            "@components": "/src/components",
            "@hooks": "/src/hooks",
            "@pages": "/src/pages",
            "@store": "/src/store",
            "@slices": "/src/store/apiSlice",
            "@utils": "/src/Utils"
        }
    },

    // Sentry est charge dynamiquement (optional dep). Si non installe, ignorer.
    build: {
        rollupOptions: {
            external: ['@sentry/react', '@sentry/node'],
            onwarn(warning, defaultHandler) {
                if (warning.code === 'UNRESOLVED_IMPORT' && /^@sentry\//.test(warning.message)) {
                    return
                }
                defaultHandler(warning)
            }
        }
    }
})
