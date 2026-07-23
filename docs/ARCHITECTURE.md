# Arquitectura

La tienda Astro y el panel React/Vite se publican como sitios estáticos independientes en Cloudflare Pages. Ambos consumen la API Express desplegada en Railway.

Toda la persistencia estructurada utiliza PostgreSQL mediante Prisma. Los archivos no se guardan en PostgreSQL ni en Railway: la API valida y carga imágenes y videos directamente a Cloudinary, y almacena únicamente URLs, public IDs y metadatos.

En producción `BANNER_STORAGE` debe ser `cloudinary`. El modo `local` existe únicamente en archivos ignorados por Git para pruebas de desarrollo.
