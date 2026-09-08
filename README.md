# Proyecto Módulo 7

Proyecto realizado para el Módulo 7 del curso de Desarrollo de Aplicaciones Full Stack JavaScript.

En este proyecto trabajé con Node.js y PostgreSQL para conectar una aplicación con una base de datos y realizar operaciones para crear, consultar, actualizar y eliminar información.

También utilicé Sequelize para trabajar con modelos y relaciones entre usuarios y pedidos.

## Tecnologías utilizadas

- Node.js
- Express
- PostgreSQL
- Sequelize
- pg
- dotenv
- bcryptjs
- nodemon

## Funcionalidades

El proyecto permite:

- crear usuarios
- consultar usuarios
- actualizar usuarios
- eliminar usuarios
- crear pedidos
- consultar pedidos
- relacionar usuarios con pedidos
- consultar un usuario junto con sus pedidos
- realizar consultas usando SQL
- realizar consultas usando Sequelize
- utilizar transacciones con commit y rollback
- validar datos ingresados
- manejar errores

## Base de datos

Para este proyecto utilicé PostgreSQL.

La base de datos utilizada se llama:

`bootcamp_m7`

El proyecto trabaja principalmente con dos tablas:

- usuarios
- pedidos

Un usuario puede tener varios pedidos.

## Instalación

Primero se deben instalar las dependencias:

```bash
npm install
```

Luego se debe crear un archivo `.env` tomando como ejemplo el archivo `.env.example`.

Ejemplo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bootcamp_m7
DB_USER=postgres
DB_PASSWORD=tu_password
```

## Datos de prueba

Para crear los datos iniciales se puede ejecutar:

```bash
npm run seed
```

Esto crea usuarios y pedidos de prueba en la base de datos.

## Ejecutar el proyecto

Para iniciar el servidor:

```bash
npm run dev
```

El servidor se ejecuta en:

`http://localhost:3000`

## Rutas utilizadas

### Usuarios

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

Consultar un usuario junto con sus pedidos:

`GET /api/usuarios/:id/detalles`

### Transacciones

Para probar una transacción:

`POST /api/usuarios/transaccion`

La transacción permite crear un usuario y un pedido.

También se puede provocar un error para comprobar que rollback deshaga los cambios.

### Pedidos

Consultar pedidos:

`GET /api/pedidos`

Crear pedido:

`POST /api/pedidos`

## Pruebas realizadas

Las rutas fueron probadas utilizando Postman.

También utilicé pgAdmin para revisar las tablas y comprobar que los registros quedaran guardados en PostgreSQL.

Las capturas de las pruebas se encuentran en la carpeta `evidencias`.

## Lo aprendido

Con este proyecto pude practicar la conexión entre Node.js y PostgreSQL y realizar operaciones CRUD.

También aprendí a utilizar Sequelize para trabajar con modelos y relaciones entre tablas y a utilizar transacciones para confirmar o deshacer cambios cuando ocurre un error.