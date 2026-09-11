# Migraciones (no ejecutadas durante la fase 1)

El arranque ya no ejecuta sequelize.sync. No hay comandos down ni DROP.

## Base nueva

1. Crear una base **nueva y vacía**, con credenciales independientes y permisos de creación de esquema.
2. Configurar el entorno local siguiendo .env.example. Comprobar manualmente el destino sin publicar la contraseña.
3. Solo cuando se haya autorizado ese destino, establecer MIGRATION_ALLOW_EMPTY_DATABASE=true para esa ejecución.
4. Ejecutar npm run db:migrate. Retirar la variable al terminar.

El runner obtiene un bloqueo transaccional, rechaza una base con tablas existentes y aplica 001-initial.sql más su registro/checksum en una transacción. Una segunda ejecución con el mismo checksum no vuelve a crear tablas. Una discrepancia se rechaza.

## Base actual del curso

**No ejecutar la migración inicial.** No se ha conectado ni inspeccionado el esquema existente. Se necesita una revisión de solo lectura, respaldo y autorización para preparar una migración de adopción. No se marca una migración como aplicada sin verificar el esquema. Los cambios del modelo no alteran la base automáticamente.

La restricción NOT NULL de usuarioId y los CHECK/índice nuevos solo estarán garantizados en una base creada con esta migración. La API valida entradas también para el esquema legado. No existe todavía un plan automatizado de adopción de datos existentes.

## Seed opcional

No forma parte de la instalación normal. Requiere NODE_ENV=development o test, SEED_ALLOW_EMPTY_DATABASE=true y SEED_PASSWORD definido explícitamente. Solo inserta datos sintéticos en tablas ya migradas y vacías; rechaza tablas con datos y producción. Nunca ejecutarlo sobre la base real. No se ejecutó durante esta fase.
