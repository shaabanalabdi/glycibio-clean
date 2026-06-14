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
            },
            output: {
                // Vendor splitting : sort React/Router/Redux du chunk principal
                // vers des chunks "vendor" stables (mieux caches entre deploys,
                // telecharges en parallele). On NE touche PAS a lucide-react :
                // Vite le code-split deja par icone (charge a la demande).
                manualChunks(id) {
                    if (!id.includes('node_modules')) return
                    if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
                        return 'react-vendor'
                    }
                    if (/[\\/]node_modules[\\/](@reduxjs|react-redux|redux|redux-thunk|reselect|immer)[\\/]/.test(id)) {
                        return 'redux-vendor'
                    }
                    // tout le reste -> strategie de chunking par defaut de Vite
                }
            }
        }
    }
})
