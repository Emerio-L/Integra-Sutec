# Integra Sutec

Monorepo preparado para producción con:

- Tienda pública: Astro en Cloudflare Pages.
- Panel administrativo: React/Vite en Cloudflare Pages.
- API: Express en Railway.
- Base de datos única: PostgreSQL mediante Prisma.
- Imágenes y videos: Cloudinary.

## Desarrollo

```bash
pnpm install
pnpm prisma:generate
pnpm --filter @integra/api prisma:migrate:deploy
pnpm dev
```

Copia `.env.example` a `.env`. Para producción configura `DATABASE_URL`, secretos JWT, credenciales Cloudinary, `CORS_ORIGIN`, `PUBLIC_API_URL` y `VITE_API_URL`.

## Producción

Railway ejecuta la migración versionada antes de iniciar la API. Cloudflare Pages compila:

- Tienda: `pnpm build:store`, salida `frontend/store/dist`.
- Panel: `pnpm build:admin`, salida `frontend/admin/dist`.

No se almacenan archivos persistentes en Railway ni en Git.
