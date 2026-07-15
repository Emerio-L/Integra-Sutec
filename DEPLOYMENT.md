# Guía de Despliegue — Integra Sutec

## Paso 1: Configurar MongoDB Atlas

### 1.1 Obtener la Connection String
1. Inicia sesión en [MongoDB Atlas](https://cloud.mongodb.com)
2. En tu cluster, haz clic en **"Connect"** → **"Drivers"**
3. Selecciona **Node.js** y copia la connection string. Tiene este formato:
   ```
   mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

### 1.2 Crear la base de datos
1. En Atlas, ve a **"Browse Collections"**
2. Crea una base de datos llamada **`integra_sutec`**
3. MongoDB creará las colecciones automáticamente al arrancar el sistema

### 1.3 Whitelist de IPs
1. En el menú lateral, ve a **"Network Access"**
2. Agrega la IP de tu servidor (o `0.0.0.0/0` solo para desarrollo)

---

## Paso 2: Configurar el archivo `.env`

Abre el archivo `.env` en la raíz del proyecto y reemplaza los valores:

```env
# Reemplaza con tu connection string real de Atlas
MONGODB_URI=mongodb+srv://miusuario:mipassword@mi-cluster.abc123.mongodb.net/integra_sutec?retryWrites=true&w=majority

# Cambia estos secretos a valores aleatorios largos en producción
JWT_SECRET=cambia_esto_a_un_secreto_largo_y_aleatorio_produccion
JWT_REFRESH_SECRET=cambia_esto_a_otro_secreto_diferente_produccion

# Ajusta al dominio de producción de tu frontend
CORS_ORIGIN=https://tudominio.com,https://admin.tudominio.com
```

**⚠️ IMPORTANTE:** Nunca subas el archivo `.env` real a Git. Está en `.gitignore`.

---

## Paso 3: Instalar dependencias y poblar la base de datos

Abre PowerShell en la carpeta del proyecto:

```powershell
# Instalar todas las dependencias
pnpm install

# Poblar la base de datos con datos de prueba
pnpm --filter @integra/api seed
```

Verás en consola:
```
✅ Conectado a MongoDB Atlas
✅ 3 usuarios creados
✅ 8 categorías creadas
✅ 10 marcas creadas
✅ 10 productos creados
✅ 5 clientes creados
✅ 3 proveedores creados
📧 Login: admin@integrasutec.com / Admin123!
```

---

## Paso 4: Ejecutar en Desarrollo Local

```powershell
# Terminal 1: Iniciar la API (puerto 4000)
pnpm dev:api

# Terminal 2: Iniciar el sitio público (puerto 3000)
pnpm dev:web

# Terminal 3: Iniciar el panel admin (puerto 5173)
pnpm dev:admin
```

Accede a:
- 🌐 **Sitio público:** http://localhost:3000
- ⚙️ **Panel admin:** http://localhost:5173
- 🔧 **API health:** http://localhost:4000/api/health

---

## Paso 5: Build de Producción

```powershell
# Compilar el sitio público
pnpm build:web

# Compilar el panel admin
pnpm build:admin
```

Los archivos estáticos quedan en:
- `apps/web/dist/` — Sitio público
- `apps/admin/dist/` — Panel admin

---

## Paso 6: Despliegue en Producción

### Opción A: Render.com (Recomendado — gratuito para empezar)

**API (Node.js):**
1. Crea un nuevo **Web Service** en [render.com](https://render.com)
2. Conecta tu repositorio GitHub
3. Configuración:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
4. Agrega las variables de entorno (copia de tu `.env`)

**Sitio Público & Admin (Static Site):**
1. Crea un **Static Site** en Render
2. Para el **web:**
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. Repite para **admin** con `apps/admin`

### Opción B: VPS (DigitalOcean, Linode, AWS EC2)

```bash
# En el servidor
git clone https://github.com/tu-repo/integra-sutec.git
cd integra-sutec

# Instalar pnpm
npm install -g pnpm

# Instalar dependencias
pnpm install

# Configurar .env con datos de producción
cp .env.example .env
nano .env

# Instalar PM2 para mantener la API corriendo
npm install -g pm2

# Iniciar la API
pm2 start apps/api/src/app.js --name "integra-api"
pm2 save
pm2 startup

# Build de los frontends
pnpm build:web
pnpm build:admin

# Servir con Nginx (ver config abajo)
```

**Configuración Nginx sugerida:**
```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Sitio público
    root /var/www/integra-sutec/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name admin.tudominio.com;

    root /var/www/integra-sutec/apps/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Paso 7: Configurar HTTPS (SSL)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados para todos los dominios
sudo certbot --nginx -d tudominio.com -d admin.tudominio.com -d api.tudominio.com
```

---

## Credenciales de Prueba (tras ejecutar el seed)

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin Principal | admin@integrasutec.com | Admin123! | admin |
| Carlos Méndez | carlos@integrasutec.com | Seller123! | seller |
| María López | maria@integrasutec.com | Manager123! | manager |

**⚠️ Cambia estas contraseñas inmediatamente en producción.**

---

## Estructura Final del Proyecto

```
integra-sutec/
├── apps/
│   ├── api/                    # Node.js + Express (Puerto 4000)
│   │   └── src/
│   │       ├── app.js          # Entrada principal
│   │       ├── config/         # DB, configuración
│   │       ├── middleware/     # Auth JWT, errorHandler
│   │       ├── modules/        # auth, products, categories, brands,
│   │       │                   # inventory, customers, suppliers,
│   │       │                   # quotes, invoices, dashboard
│   │       ├── utils/          # pdfGenerator
│   │       └── seed.js         # Script de datos iniciales
│   ├── web/                    # Astro + Tailwind (Puerto 3000)
│   │   └── src/
│   │       ├── layouts/        # BaseLayout.astro
│   │       ├── pages/          # index, catalogo, nosotros,
│   │       │                   # contacto, cotizacion
│   │       └── styles/         # global.css
│   └── admin/                  # React + Vite (Puerto 5173)
│       └── src/
│           ├── context/        # AuthContext
│           ├── layouts/        # AdminLayout
│           ├── pages/          # Dashboard, Products, Categories,
│           │                   # Brands, Inventory, Customers,
│           │                   # Suppliers, Quotes, Invoices, Login
│           ├── services/       # api.js (Axios + interceptors)
│           └── components/     # CrudPage (reusable)
└── packages/
    └── shared/                 # Constantes, mappers, validadores GT
```
