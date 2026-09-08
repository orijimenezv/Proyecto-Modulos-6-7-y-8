# Capturas que debes tomar para la entrega

Las capturas deben ser reales, con tu servidor y PostgreSQL funcionando.

1. Terminal con el mensaje: `Conexión a PostgreSQL establecida correctamente`.
2. Postman: `GET /api/usuarios` mostrando al menos 3 usuarios.
3. Postman: `POST /api/usuarios` mostrando creación exitosa.
4. Postman: `PUT /api/usuarios/:id` mostrando actualización exitosa.
5. Postman: `DELETE /api/usuarios/:id` mostrando eliminación exitosa.
6. Postman: `GET /api/usuarios/:id/detalles` mostrando el usuario con `pedidos` anidados.
7. Postman: `GET /api/usuarios/sql` para demostrar consulta SQL manual.
8. Postman: `GET /api/usuarios` para comparar el mismo resultado mediante ORM.
9. Terminal o Postman con una transacción exitosa (`forzarError: false`).
10. Terminal o Postman con una transacción fallida (`forzarError: true`) y mensaje de ROLLBACK.
11. pgAdmin mostrando las tablas `usuarios` y `pedidos` con sus registros.

Guarda las imágenes en esta carpeta antes de subir la entrega a Drive.
