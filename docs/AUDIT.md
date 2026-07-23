# Auditoría de preparación

La versión actual utiliza PostgreSQL/Prisma como única base de datos, Cloudinary como almacenamiento de medios, Railway para API y Cloudflare Pages para tienda y panel. Los archivos locales de prueba, secretos, builds y uploads están excluidos de Git.

Antes de publicar se deben ejecutar generación Prisma, migraciones versionadas, pruebas y las tres compilaciones.
