# Integra Sutec

Monorepo con tienda Astro, panel React/Vite y API Express. El módulo **Contenido del sitio → Banner principal** administra imágenes y videos de Cloudinary; sus referencias se guardan en PostgreSQL mediante Prisma.

## Desarrollo

1. Copiar `.env.example` a `.env` y configurar MongoDB (módulos heredados), PostgreSQL, JWT y Cloudinary.
2. Ejecutar `pnpm install`.
3. Ejecutar `pnpm prisma:generate` y `pnpm --filter @integra/api prisma:migrate:deploy`.
4. Ejecutar `pnpm dev`.

URLs: tienda `http://localhost:3000`, panel `http://localhost:5173`, API `http://localhost:4000`.

Los banners aceptan JPEG, PNG, WebP o AVIF (8 MB) y MP4, WebM o MOV validado (30 MB, máximo 20 s). El video requiere poster y en el sitio siempre se reproduce silenciado, en bucle, inline y sin controles.
