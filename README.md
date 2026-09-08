# Proyecto Módulo 7

Proyecto realizado para el Módulo 7 del curso de Desarrollo de Aplicaciones Full Stack JavaScript.

En este proyecto trabajé con Node.js y PostgreSQL para aprender a conectar una aplicación con una base de datos y realizar operaciones para crear consultar actualizar y eliminar información.

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
- validar algunos datos ingresados
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