# Fase 1: informe de entrega

Base de comparación: 8cd66c0. Rama: mejora-portafolio-backend. main y origin/main coincidían después de fetch. El árbol estaba limpio antes de trabajar; no es posible inspeccionar buffers no guardados de editores.

## Resultado

Backend reforzado con propiedad de recursos, JWT HS256, revocación por cambio de contraseña/cuenta, CORS configurable, validación, errores seguros, logs de consola, SQL manual sobre el pool de Sequelize y archivos locales privados. Producción rechaza almacenamiento local y exige TLS/orígenes explícitos.

No se crearon frontend, configuración de Vercel ni conexiones externas. No hubo push, merge, reescritura de historial, sync, ejecución de migraciones o seed. La base existente no se consultó ni modificó. El .env real permanece intacto.

## Pruebas realizadas

- npm test: 43 pruebas aprobadas, 0 fallidas.
- npm run check: 38 archivos JavaScript con sintaxis correcta.
- Colección Postman: JSON válido y scripts parseables; 22 solicitudes. No ejecutada contra una API real.
- git diff --check: sin errores de whitespace.
- package-lock.json y versiones de dependencias sin cambios.

Los tests HTTP usan Express real y modelos simulados. La validación de modelos reales solo opera en memoria. Las conexiones del driver están bloqueadas por el harness. Migraciones/transacciones se prueban con simulaciones: la atomicidad y DDL reales requieren una base desechable autorizada. Los archivos sintéticos temporales se limpiaron al terminar.

## Secretos y decisiones del usuario

| Tipo | Archivo de origen | Acción |
|---|---|---|
| Credencial PostgreSQL visible | evidencias/ROLLBACK VS CODE.PNG | Imagen eliminada del árbol actual; debe rotarse |
| Hashes de contraseña visibles | evidencias/PGADMIN USUARIO.PNG | Imagen eliminada del árbol actual; no reutilizar credenciales de demostración |

Ambas capturas formaron parte del historial desde b251912. Borrarlas en el commit actual no elimina la exposición histórica. No se reprodujeron sus valores. La búsqueda de los valores actuales de DB_PASSWORD/JWT_SECRET en texto versionado del historial local no encontró coincidencias; no cubre por sí sola imágenes ni constituye garantía de ausencia de otros secretos.

La clave JWT actual del .env no cumple la validación nueva: **el usuario debe configurar manualmente una clave aleatoria de al menos 32 bytes**. No se cambió el .env ni se generó una clave nueva para el servidor. La rotación de la credencial expuesta y la limpieza del historial requieren acciones posteriores; no se efectuaron.

La migración inicial solo sirve para una base nueva y vacía. Adoptar el esquema existente requiere revisión, respaldo y autorización. El modelo define usuarioId NOT NULL, pero no se aplicó esa restricción al esquema antiguo.

## Contrato de endpoints

Registro y login son públicos y limitados. Registrar una cuenta junto a su primer pedido sigue siendo público, pero solo crea recursos nuevos de esa nueva cuenta y rechaza forzarError/usuarioId ajeno. Todos los recursos existentes de usuarios, pedidos y archivos requieren JWT y propiedad.

GET /api/usuarios y GET /api/usuarios/sql conservan arrays pero solo retornan la cuenta autenticada. Rutas /api/pedidos se limitan al dueño y usan 404 para recursos ajenos; intentar asignarlos a otro usuario devuelve 403. Los endpoints exactos y ejemplos están en el README actualizado.

## PostgreSQL y Sequelize

Un único pool (máximo configurable, defecto 2). SQL manual parametrizado con sequelize.query. Configuración por DB_* o DATABASE_URL, TLS con verificación, entornos diferenciados. No hay sincronización de modelos. Migración inicial transaccional con checksum y rechazo de tablas existentes; no se ejecutó. Seed protegido: no producción, flag explícito, contraseña por entorno, tablas ya creadas y sin datos; tampoco se ejecutó.

## JWT

HS256, emisor/audiencia explícitos, TTL por segundos y clave exclusiva del entorno. Cada solicitud valida la existencia de la cuenta y una versión de credencial HMAC: cambiar contraseña o eliminar cuenta invalida tokens anteriores. 401 para sesión inválida, 403 para propiedad incorrecta. Bcrypt conserva coste 10. Password nuevo: mínimo 8 caracteres, máximo 72 bytes. Login permite credenciales legadas más cortas.

## Multer

Memoria con máximo 2 MiB, extensión/MIME y firma mínima PNG/JPEG, UUID, descarga autenticada y directorio privado por propietario. Se retiró el acceso estático a uploads. Producción devuelve 503 hasta conectar almacenamiento externo mediante el contrato save/read. No hay proveedor ni URL inventada. No se implementó decodificación completa/antivirus, cuota total ni limpieza de archivos huérfanos.

## Pendientes para Vercel y portafolio

Configurar entorno/secretos del despliegue, región y pooling, migración autorizada en base nueva o adopción de la actual, proxy confiable y contador distribuido, almacenamiento de objetos con metadatos/retención y pruebas reales aisladas. Después construir frontend Pages y configurar su origen y URL de API. El limitador en memoria no garantiza cuotas entre múltiples instancias.

Postman JSON es la colección actual. Las colecciones YAML originales son evidencia histórica, no el runner vigente. El README lo indica explícitamente.

## Inventario exacto frente a la base

26 modificados, 16 añadidos y 4 eliminados; 46 archivos en total. No se cuentan directorios ni dependencias locales.

| Estado | Archivo relativo a la raíz del repositorio |
|---|---|
| Modificado | `.env.example` |
| Modificado | `.gitignore` |
| Añadido | `docs/FASE1.md` |
| Eliminado | `evidencias/PGADMIN USUARIO.PNG` |
| Eliminado | `evidencias/ROLLBACK VS CODE.PNG` |
| Modificado | `index.js` |
| Eliminado | `logs/log.txt` |
| Añadido | `migrations/001-initial.sql` |
| Añadido | `migrations/README.md` |
| Modificado | `package.json` |
| Modificado | `postman/Modulo7.postman_collection.json` |
| Modificado | `README.md` |
| Añadido | `scripts/check.js` |
| Añadido | `scripts/migrate.js` |
| Modificado | `src/app.js` |
| Modificado | `src/config/database.js` |
| Añadido | `src/config/env.js` |
| Eliminado | `src/config/rawPool.js` |
| Modificado | `src/controllers/authController.js` |
| Modificado | `src/controllers/pedidoController.js` |
| Modificado | `src/controllers/usuarioController.js` |
| Modificado | `src/middlewares/authMiddleware.js` |
| Añadido | `src/middlewares/corsMiddleware.js` |
| Modificado | `src/middlewares/errorHandler.js` |
| Añadido | `src/middlewares/ownerMiddleware.js` |
| Añadido | `src/middlewares/rateLimit.js` |
| Modificado | `src/middlewares/requestLogger.js` |
| Modificado | `src/middlewares/uploadMiddleware.js` |
| Modificado | `src/models/index.js` |
| Modificado | `src/routes/authRoutes.js` |
| Modificado | `src/routes/pedidoRoutes.js` |
| Modificado | `src/routes/uploadRoutes.js` |
| Modificado | `src/routes/usuarioRoutes.js` |
| Modificado | `src/seed.js` |
| Modificado | `src/server.js` |
| Modificado | `src/services/pedidoService.js` |
| Modificado | `src/services/rawSqlService.js` |
| Añadido | `src/services/storageService.js` |
| Modificado | `src/services/transaccionService.js` |
| Modificado | `src/services/usuarioService.js` |
| Añadido | `src/utils/tokens.js` |
| Añadido | `src/utils/validation.js` |
| Añadido | `test/api.test.js` |
| Añadido | `test/config.test.js` |
| Añadido | `test/helpers.js` |
| Añadido | `test/models.test.js` |

## Commits

Los cambios se separan en commits de saneamiento, configuración/persistencia, permisos/JWT, archivos/CORS, tests y documentación. Consultar git log --oneline main..mejora-portafolio-backend para los hashes completos de esta entrega. No se hizo push ni merge.
