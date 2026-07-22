# Despliegue Railway y Cloudflare Pages

## Railway

Configurar `DATABASE_URL`, variables MongoDB heredadas, JWT, CORS y las tres credenciales Cloudinary. Antes de iniciar una versión ejecutar:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm --filter @integra/api prisma:migrate:deploy
pnpm build:api
pnpm --filter @integra/api start
```

Los archivos se mantienen en memoria únicamente durante la solicitud y nunca se escriben en el filesystem efímero.

## Cloudflare Pages

Para la tienda configurar `PUBLIC_API_URL=https://api.example.com`; para el panel, `VITE_API_URL=https://api.example.com/api`. Comandos de build: `pnpm build:store` y `pnpm build:admin`. Directorios: `frontend/store/dist` y `frontend/admin/dist`.

Tras desplegar, comprobar CORS, creación/reemplazo/borrado, endpoint público, móvil, reduced motion y caché `max-age=60, stale-while-revalidate=300`.
