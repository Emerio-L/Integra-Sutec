# Auditoría técnica — Fase 1

Fecha: 22 de julio de 2026  
Rama: `refactor/postgresql-cloudflare`  
Repositorio: `Emerio-L/Integra-Sutec`

## Alcance y línea base

La auditoría se realizó antes de cambiar lógica comercial. El árbol Git estaba limpio en `main`. Se inspeccionaron los paquetes raíz, workspace, aplicaciones pública y administrativa, API, paquete compartido, modelos Mongoose, rutas, controladores, middlewares, autenticación, carga de archivos, variables y documentación de despliegue.

Entorno usado:

- Node.js `v24.13.0` (cumple `>=20`).
- pnpm `11.9.0`.
- No existe un `.env` versionado ni una instancia MongoDB local configurada.

Comportamiento de la línea base:

- `pnpm build:web`: correcto fuera del sandbox; Astro generó 5 páginas estáticas.
- `pnpm build:admin`: correcto tras el movimiento; Vite transformó 730 módulos y generó el bundle de producción.
- `pnpm build:api`: fallaba porque la API no tenía script `build`.
- `pnpm lint`: fallaba porque ningún paquete tenía script `lint`; en Fase 1 se añadió validación sintáctica a toda la API, pero aún falta incorporar un linter de estilo a los frontends.
- `pnpm test`: fallaba porque no existía script `test`.
- `pnpm --filter @integra/api start`: termina con error explícito porque falta `MONGODB_URI`.
- Los primeros builds de Astro/Vite dentro del sandbox fallaron por permisos del entorno, no por errores del código. Astro se confirmó fuera del sandbox.

No fue posible probar flujos con datos ni endpoints dependientes de MongoDB sin credenciales. No se inventaron credenciales ni datos para ocultar esta limitación.

## Estructura encontrada

Antes del movimiento:

```text
apps/web       Astro + Tailwind
apps/admin     React 19 + Vite
apps/api       Express 5 + Mongoose
packages/shared constantes, mappers y validadores CommonJS
```

Después del movimiento seguro de Fase 1:

```text
frontend/store
frontend/admin
backend/api
packages/shared
docs
```

Los paquetes se denominan `@integra/store`, `@integra/admin`, `@integra/api` y `@integra/shared`. El workspace apunta a `frontend/*`, `backend/*` y `packages/*`.

## Dependencias actuales

| Área | Dependencias principales | Observación |
|---|---|---|
| Store | Astro 6, Tailwind 3 | Mayormente estático; el catálogo contiene JavaScript cliente extenso. |
| Admin | React 19, React Router 7, Axios, Recharts, react-hot-toast | CRUD y dashboard ya implementados parcialmente. |
| API | Express 5, Mongoose 8, JWT, bcryptjs, Helmet, CORS, rate limit, Multer, Sharp, PDFKit | Monolito modular; todavía acoplado a MongoDB y disco local. |
| Shared | CommonJS sin build | Constantes, formato GTQ, validación de NIT/teléfono/email y mapeo de claves. |

## Módulos y estado funcional observado

| Módulo | Estado | Conservación/migración prevista |
|---|---|---|
| Auth y usuarios | Implementado con JWT, refresh token, bcrypt y roles | Conservar reglas; migrar consultas a repositorios Prisma y endurecer sesión/roles. |
| Productos | CRUD, filtros, imágenes y consumo público/admin | Conservar UX y contratos temporalmente; reemplazar persistencia y uploads. |
| Categorías | CRUD público/admin | Conservar; añadir orden, destacado, imágenes y protección de borrado. |
| Marcas | CRUD público/admin | Conservar; ampliar metadatos y Cloudinary. |
| Inventario | Entradas, salidas, transferencias y alertas | Conservar reglas; hacerlas transaccionales y evitar stock negativo. |
| Clientes | CRUD autenticado | Conservar y migrar. |
| Proveedores | CRUD autenticado y relación con marcas | Conservar y migrar. |
| Cotizaciones | CRUD parcial, estados y PDF | Conservar; corregir numeración y transacciones. |
| Facturas | Creación, conversión desde cotización, pago y PDF | Conservar; migrar con transacciones y secuencia segura. |
| Pedidos web | Creación pública, listado, estado, factura y PDF | Conservar; el backend debe recalcular precios y stock de forma atómica. |
| Solicitudes de cotización | Creación pública y gestión admin | Conservar y adaptar al prefijo v1. |
| Contacto | Formulario público y bandeja admin | Conservar; separar modelo/ruta y añadir antispam/validación. |
| Dashboard | Métricas basadas en consultas reales | Conservar consultas reales; no introducir métricas ficticias. |
| Banners | No existe | Implementar en fases posteriores. |
| Configuración del sitio | No existe | Implementar en fases posteriores. |
| Favoritos | No existe como módulo aislado | Implementar solo en `localStorage`, sin backend. |
| Carrito | Existe embebido en el catálogo público | Extraer y reforzar sin perder el flujo actual. |

El panel contiene una página `Quotes.jsx`, pero no está enlazada en `App.jsx`; debe verificarse antes de eliminarla o restaurar su navegación. También existen archivos iniciales de Vite (`main.ts`, `counter.ts`, `style.css`) junto a la entrada React real, posibles residuos que no se eliminarán hasta confirmar referencias.

## Endpoints actuales

Prefijo general actual: `/api`.

| Prefijo | Métodos/rutas |
|---|---|
| `/api/auth` | `POST /login`, `POST /refresh`, `GET /profile`, CRUD parcial `/users` y cambio de contraseña |
| `/api/products` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, carga/eliminación de imágenes |
| `/api/categories` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/brands` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/inventory` | `GET /movements`, `GET /alerts`, `POST /entry`, `/exit`, `/transfer` |
| `/api/customers` | CRUD autenticado |
| `/api/suppliers` | CRUD autenticado |
| `/api/quotes` | listado, detalle, PDF, creación y cambio de estado |
| `/api/invoices` | listado, detalle, PDF, creación, creación desde cotización y estado de pago |
| `/api/dashboard` | `GET /metrics` |
| `/api/quote-requests` | `POST /public`, listado, cambio de estado y eliminación |
| `/api/orders` | `POST /public`, listado, detalle, estado, factura, PDF y eliminación |
| `/api/contacts` | `POST /public`, listado, cambio de estado y eliminación |
| `/api/health` | estado y timestamp sin comprobación de base de datos |

Hallazgos de autorización:

- Productos, categorías y marcas exponen lectura pública y protegen mutaciones.
- Clientes, proveedores, inventario, cotizaciones y facturas aplican autenticación a todo el router.
- Pedidos, contactos y solicitudes mezclan rutas públicas y administrativas en el mismo router.
- Hay lógica de base de datos directamente en rutas de auth, contactos, pedidos y solicitudes; debe extraerse a controller/service/repository.
- El middleware acepta JWT por query string para PDFs, con riesgo de filtración en historial/logs.

## Modelos MongoDB y relaciones PostgreSQL requeridas

| Modelo Mongo actual | Relaciones/transformación requerida |
|---|---|
| User | `Role` enum; relación opcional con movimientos y documentos creados; `password_hash` → `passwordHash`. |
| Category | Uno-a-muchos con Product; slug único; ampliar flags, orden y metadatos Cloudinary. |
| Brand | Uno-a-muchos con Product y muchos-a-muchos con Supplier. |
| Product | FK Category y Brand; arrays de imágenes → ProductImage; dinero → Decimal(12,2); specs → Json. |
| InventoryMovement | FK Product y User; snapshots de stock y referencia externa. |
| Customer | Uno-a-muchos con Order, Quote e Invoice cuando exista asociación. |
| Supplier | Relación muchos-a-muchos con Brand. |
| Quote | Items embebidos → QuoteItem; FK Customer/User; secuencia segura. |
| Invoice | Items embebidos → InvoiceItem; FK Quote/Order/Customer/User; secuencia segura. |
| Order | Items embebidos → OrderItem; FK Customer opcional; snapshots del comprador/producto; secuencia segura. |
| QuoteRequest | FK Quote opcional (`converted_quote_id`); conservar datos capturados. |
| Contact | Modelo separado; conservar estados y timestamps. |

No se encontraron modelos de reseñas, ratings o estrellas. No deben crearse.

## Frontend público

- Páginas: inicio, catálogo, nosotros, contacto y cotización.
- Inicio y páginas informativas contienen contenido principalmente estático.
- Catálogo consulta productos/categorías/marcas y contiene carrito/checkout en JavaScript cliente.
- No existe aún `/productos/[slug]` ni la arquitectura final de búsqueda paginada.
- Los formularios de contacto y cotización llaman endpoints públicos reales.
- Hay inconsistencias en la construcción de URL de API entre páginas (`/api/...` frente a rutas sin ese segmento).
- Se observan textos con mojibake en archivos y salida de consola; debe normalizarse UTF-8 de forma controlada.

## Panel administrativo

- Rutas protegidas en cliente para dashboard, productos, categorías, marcas, inventario, clientes, proveedores, facturas, solicitudes, pedidos, contactos y usuarios.
- La seguridad efectiva depende del backend, como corresponde, pero access y refresh tokens se guardan hoy en `localStorage`.
- `CrudPage` reutiliza formularios/tablas; conviene conservarlo o evolucionarlo sin duplicar lógica.
- Maneja carga y errores básicos, pero faltan estados accesibles completos y pruebas.

## Imágenes y archivos

- Multer usa memoria, Sharp convierte a WebP y luego escribe en `public/uploads/products`.
- La API sirve `/uploads` con CORS `*` específico para imágenes.
- Hay imágenes de producto versionadas dentro del repositorio.
- Este mecanismo debe permanecer solo hasta validar Cloudinary; luego se reemplazará por un servicio central con compensación ante fallos de DB.

## Despliegue y configuración

- `DEPLOYMENT.md` describe MongoDB Atlas, Render/VPS/Nginx y contiene credenciales de seed públicas. Es documentación heredada y no representa el objetivo Railway/Cloudflare.
- Variables actuales detectadas: `MONGODB_URI`, secretos JWT, expiraciones, `API_PORT`, `API_URL`, `CORS_ORIGIN`, `PUBLIC_API_URL` y `VITE_API_URL`.
- No se detectaron secretos reales versionados en `.env.example`, pero sí credenciales ficticias/de prueba documentadas; deben retirarse al reemplazar la guía.
- No existen aún configuraciones finales de Cloudflare Pages, Railway, PostgreSQL, Prisma ni Cloudinary.

## Riesgos de migración

1. Numeración de pedidos basada en consultar el último registro; no es segura con concurrencia.
2. Operaciones de pedido/inventario/factura no están garantizadas por una única transacción.
3. Dinero almacenado como `Number` de MongoDB; requiere conversión y verificación exacta a Decimal.
4. Arrays embebidos de items e imágenes requieren tablas y equivalencias de IDs.
5. Escritura de imágenes en disco no es compatible con Railway efímero.
6. Consultas Mongoose aparecen en routes/controllers; una sustitución directa sería difícil de revisar.
7. Contratos usan `_id` y snake_case; el panel depende de ellos. La transición debe incluir mappers o una versión coordinada.
8. Tokens en localStorage y token por query string amplían exposición ante XSS/logs.
9. Falta cobertura automatizada; primero se necesitan pruebas de caracterización para reglas críticas.
10. MongoDB no está disponible en el entorno de auditoría; los conteos y migración de datos requieren acceso controlado posterior.
11. Texto con codificación dañada puede afectar UX, slugs, seeds y comparaciones.
12. Windows mantuvo abierta la carpeta heredada vacía `apps/api` tras `node --watch`; su contenido ignorado fue eliminado y no contiene código versionado.

## Datos potencialmente migrables

Se migrarán, si existen en la base fuente: usuarios, categorías, marcas, productos, URLs/archivos de imágenes, proveedores, clientes, movimientos, pedidos, solicitudes, cotizaciones, facturas y contactos. Los binarios locales requerirán carga a Cloudinary y posterior sustitución de URL; PostgreSQL almacenará únicamente URL, `public_id` y metadatos.

Antes de retirar MongoDB se exigirán: respaldo, dry-run, tabla/archivo de equivalencias protegido, conteos por colección/tabla, validación de relaciones y dinero, ejecución real, verificación posterior, pruebas manuales y rollback documentado.

## Decisiones de Fase 1

- Mantener CommonJS y JavaScript durante el movimiento para evitar mezclar reorganización con reescritura.
- Mantener temporalmente Mongoose y uploads locales; su sustitución pertenece a fases 2–3 y se hará con convivencia verificable.
- Conservar aliases por nombre de workspace; no se encontraron imports relativos cruzando las carpetas movidas.
- Añadir aliases de compatibilidad `dev:web` y `build:web` mientras el nombre canónico pasa a `store`.
- El script `build` de API valida sintaxis de todos los archivos JavaScript de `src`; typecheck y lint semántico se incorporarán con Prisma y pruebas.
- No crear datos ficticios ni afirmar funcionamiento de servicios externos no disponibles.

## Pruebas manuales pendientes

Requieren una conexión MongoDB válida y datos autorizados:

- login/refresh/perfiles y roles;
- CRUD administrativo;
- carga y eliminación de imágenes;
- movimientos y stock;
- creación de pedido/cotización/factura y PDFs;
- formularios públicos;
- dashboard con datos reales.

Estos pendientes bloquean declarar completada la migración funcional, pero no bloquean el movimiento estructural verificable de Fase 1.
