# Arquitectura

La tienda Astro y el panel React se despliegan en Cloudflare Pages. Express se despliega en Railway. Los módulos heredados todavía usan MongoDB/Mongoose; `HeroBanner` inaugura la persistencia PostgreSQL/Prisma en esta rama. Esta convivencia es temporal y evita cambiar productos, autenticación, inventario y ventas durante la incorporación de banners.

El navegador del panel envía `multipart/form-data` autenticado a Express. La API valida firma MIME, extensión implícita, tamaño, rol y metadata; sube a Cloudinary y guarda URL más `public_id` en PostgreSQL. La tienda obtiene únicamente campos públicos mediante `/api/v1/public/banners`.

La migración está en `backend/api/prisma/migrations`. Producción siempre usa `prisma migrate deploy`, nunca `db push`.
