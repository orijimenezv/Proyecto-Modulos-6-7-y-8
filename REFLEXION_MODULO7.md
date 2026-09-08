# Reflexión técnica - Módulo 7

Para este proyecto elegí PostgreSQL porque es una base de datos relacional robusta y adecuada para trabajar con datos relacionados. La conexión se configuró mediante variables de entorno para evitar dejar credenciales sensibles escritas directamente en el código.

Utilicé Sequelize como ORM porque permite representar las tablas como modelos JavaScript y realizar operaciones CRUD de forma más clara y organizada. También dejé una consulta SQL manual con `pg` para comparar ambos enfoques. El ORM reduce código repetitivo y facilita las relaciones, mientras que SQL directo entrega mayor control sobre consultas específicas.

La actualización de usuarios permite modificar solo `nombre`, `email` y `password`, evitando que el cliente cambie campos internos como el `id` o las fechas del registro. Las contraseñas se almacenan como hash y nunca se devuelven en las respuestas de la API.

La relación principal es uno a muchos: un usuario puede tener varios pedidos y cada pedido pertenece a un solo usuario. Se usa una clave foránea `usuarioId` y borrado en cascada para evitar pedidos huérfanos cuando se elimina un usuario.

También se implementó una transacción que crea un usuario y un pedido como una sola unidad. Si una de las operaciones falla, se ejecuta ROLLBACK y no queda información incompleta en la base de datos.
