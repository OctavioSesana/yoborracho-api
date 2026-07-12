import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Corriendo dentro de Docker sobre un bind-mount de una carpeta sincronizada
    // por OneDrive: los eventos nativos de cambio de archivo (inotify) no siempre
    // llegan al contenedor, así que Vite se queda con una versión vieja del código
    // aunque el archivo en disco ya esté actualizado (esto fue la causa real del
    // bug del toggle que parecía "no arreglarse"). Con polling, Vite chequea los
    // archivos activamente en vez de depender de esos eventos.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
