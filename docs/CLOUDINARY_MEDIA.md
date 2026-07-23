# Medios de banners en Cloudinary

Carpetas: `integra-sutec/banners/images`, `integra-sutec/banners/videos` y `integra-sutec/banners/posters`. Las imágenes usan `resource_type=image`; los videos, `resource_type=video`. El secret solo existe en Railway/API.

El reemplazo sube primero el archivo nuevo, actualiza PostgreSQL y después elimina el anterior. Si la base falla, elimina el recurso nuevo. Al borrar un banner se eliminan todos los recursos cuyo `public_id` pertenezca a las carpetas permitidas. Los fallos de limpieza se registran y no exponen trazas al cliente.

Formatos: JPEG/PNG/WebP/AVIF hasta 8 MB; MP4/WebM/MOV hasta 30 MB y 20 segundos. Cloudinary debe devolver duración, dimensiones, formato y bytes. Los límites se configuran con `MAX_BANNER_*`.

El público usa poster ante error, ahorro de datos o movimiento reducido. No almacena binarios en Railway ni en Git y descarga directamente desde Cloudinary.
