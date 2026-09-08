## Parte 1 - Módulo 6

En esta parte del proyecto trabajé con Node.js y Express para crear la estructura inicial del servidor.

Se utilizó `index.js` como archivo principal porque permite iniciar el proyecto desde un punto de entrada simple y mantener el resto de la aplicación organizado dentro de la carpeta `src`.

El proyecto puede ejecutarse con:

```bash
npm start
```

Durante el desarrollo también se puede utilizar:

```bash
npm run dev
```

También se puede iniciar directamente con:

```bash
node index.js
```

### Rutas del Módulo 6

Ruta principal con respuesta HTML:

`GET /`

Ruta que muestra el estado del servidor en formato JSON:

`GET /status`

Archivo estático:

`GET /public/info.html`

### Archivos estáticos

La carpeta `public` se utiliza para guardar archivos que pueden ser vistos directamente desde el navegador.

Express utiliza `express.static()` para permitir el acceso a estos archivos.

### Registro de accesos

El proyecto incluye la carpeta `logs` con el archivo `log.txt`.

Cada vez que se accede a una ruta se registra la fecha la hora y la ruta visitada utilizando el módulo `fs` de Node.js.

La estructura del proyecto está separada en carpetas como `routes`, `controllers`, `middlewares`, `services`, `public` y `logs` para mantener el código organizado.

## Parte 2 - Módulo 7

En esta parte del proyecto trabajé con PostgreSQL para guardar y consultar información desde una base de datos.

Se utilizó Sequelize para trabajar con los modelos de usuarios y pedidos.

### Funcionalidades

- crear usuarios
- consultar usuarios
- actualizar usuarios
- eliminar usuarios
- crear pedidos
- consultar pedidos
- relacionar usuarios con pedidos
- realizar consultas con SQL
- realizar consultas con Sequelize
- utilizar transacciones con commit y rollback

### Rutas principales

Consultar usuarios:

`GET /api/usuarios`

Crear usuario:

`POST /api/usuarios`

Actualizar usuario:

`PUT /api/usuarios/:id`

Eliminar usuario:

`DELETE /api/usuarios/:id`

Consultar usuarios usando SQL:

`GET /api/usuarios/sql`

Consultar un usuario con sus pedidos:

`GET /api/usuarios/:id/detalles`

Probar una transacción:

`POST /api/usuarios/transaccion`

Las rutas fueron probadas utilizando Postman y los datos fueron revisados en PostgreSQL utilizando pgAdmin.

## Parte 3 - Módulo 8

En esta parte del proyecto trabajé con una API REST agregando autenticación mediante JWT y subida de archivos.

### Login

Se agregó la ruta:

`POST /login`

Si el correo y la contraseña son correctos se genera un token JWT.

El token tiene una duración de una hora.

### Rutas protegidas

Las siguientes rutas necesitan autenticación:

`PUT /api/usuarios/:id`

`DELETE /api/usuarios/:id`

Para acceder a estas rutas se debe enviar el token utilizando Bearer Token.

Si no se envía un token la aplicación responde con error 401.

### Subida de archivos

Se agregó la ruta:

`POST /upload`

La subida de archivos se realiza utilizando `form-data`.

La clave utilizada es:

`archivo`

Se permiten archivos:

- JPG
- JPEG
- PNG

Los archivos se guardan en:

`public/uploads`

También se configuró un límite de tamaño para los archivos.

### Pruebas realizadas

Las pruebas se realizaron utilizando Postman.

Se comprobó:

- login correcto
- generación de token JWT
- acceso sin token
- acceso con token
- actualización protegida
- eliminación protegida
- subida de archivos
- rechazo de archivos no permitidos

### Lo aprendido

En estos módulos aprendí a conectar Node.js con PostgreSQL y a trabajar con operaciones CRUD usando Sequelize.

También aprendí a proteger rutas utilizando JWT y a recibir archivos desde una petición utilizando Multer.

