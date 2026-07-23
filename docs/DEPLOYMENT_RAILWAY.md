# Railway

Usa el archivo `railway.toml` de la raíz. El servicio instala dependencias, genera Prisma, valida la API, ejecuta `prisma migrate deploy` y después inicia Express.

Variables obligatorias: `DATABASE_URL`, secretos JWT, `CORS_ORIGIN`, credenciales Cloudinary y `BANNER_STORAGE=cloudinary`.

Railway no debe usar volumen persistente para medios; todos los archivos se entregan desde Cloudinary.
