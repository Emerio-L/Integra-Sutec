# Despliegue de Integra Sutec

## 1. PostgreSQL y API en Railway

1. Crear un proyecto y agregar PostgreSQL.
2. Conectar el repositorio GitHub.
3. Configurar el servicio desde la raíz; `railway.toml` contiene build, migración y start.
4. Variables obligatorias:
   - `NODE_ENV=production`
   - `DATABASE_URL` (Railway PostgreSQL)
   - `JWT_SECRET` y `JWT_REFRESH_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `BANNER_STORAGE=cloudinary`
   - `CORS_ORIGIN=https://tienda.example,https://admin.example`
5. La orden de inicio ejecuta `prisma migrate deploy` antes de levantar Express.
6. Verificar `/api/health`.

## 2. Cloudinary

Crear un producto Cloudinary y copiar las tres credenciales únicamente a Railway. Los recursos se organizan bajo:

- `integra-sutec/products`
- `integra-sutec/banners/images`
- `integra-sutec/banners/videos`
- `integra-sutec/banners/posters`

No expongas `CLOUDINARY_API_SECRET` en Cloudflare.

## 3. Tienda en Cloudflare Pages

- Root directory: raíz del repositorio.
- Build command: `pnpm install --frozen-lockfile && pnpm build:store`
- Output directory: `frontend/store/dist`
- Variable: `PUBLIC_API_URL=https://api.example.com`

## 4. Panel en Cloudflare Pages

- Build command: `pnpm install --frozen-lockfile && pnpm build:admin`
- Output directory: `frontend/admin/dist`
- Variable: `VITE_API_URL=https://api.example.com/api`

## 5. Inicialización

Configura temporalmente `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD`, ejecuta `pnpm --filter @integra/api seed` una vez y después elimina esas variables.

Si existe una exportación del sistema anterior, después de `prisma migrate deploy` ejecuta:

```bash
pnpm --filter @integra/api data:import -- .local/legacy-export
pnpm --filter @integra/api media:migrate
```

Compara los conteos antes de habilitar el tráfico. La carpeta `.local` nunca debe subirse a Git.
