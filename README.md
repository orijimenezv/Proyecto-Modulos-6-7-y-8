# Proyecto Módulo 7 - Acceso a Datos en Aplicaciones Node.js

Aplicación backend desarrollada con **Node.js**, **Express**, **PostgreSQL**, **pg** y **Sequelize**. Implementa conexión segura a base de datos, CRUD de usuarios y pedidos, consultas parametrizadas, ORM, relaciones, transacciones, validaciones, manejo de errores y logs.

## Tecnologías

- Node.js 18+
- Express
- PostgreSQL
- Sequelize ORM
- pg
- dotenv
- bcryptjs
- nodemon

## Estructura

```text
src/
  config/        conexión Sequelize y pool pg
  controllers/   controladores HTTP
  middlewares/   logs y manejo de errores
  models/        modelos Usuario y Pedido
  routes/        rutas de la API
  services/      acceso a datos y transacciones
  utils/         utilidades
sql/             creación de base de datos
postman/         colección para probar endpoints
evidencias/      guía de capturas para la entrega
```

## 1. Crear la base de datos

En pgAdmin abre Query Tool o usa psql y ejecuta:

```sql
CREATE DATABASE bootcamp_m7;
```

## 2. Configurar variables de entorno

Copia `.env.example` y renómbralo a `.env`.

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bootcamp_m7
DB_USER=postgres
DB_PASSWORD=TU_CLAVE_POSTGRESQL
```

El archivo `.env` está incluido en `.gitignore` y **no debe subirse a GitHub**.

## 3. Instalar dependencias

```bash
npm install
```

## 4. Cargar datos de prueba

```bash
npm run seed
```

Esto crea 3 usuarios y 3 pedidos de ejemplo.

## 5. Iniciar el servidor

```bash
npm run dev
```

Debe aparecer:

```text
✅ Conexión a PostgreSQL establecida correctamente
✅ Modelos sincronizados
✅ Servidor ejecutándose en http://localhost:3000
```

## Endpoints principales

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/usuarios` | Lista usuarios |
| GET | `/api/usuarios?nombre=Juan` | Filtra por nombre |
| GET | `/api/usuarios/sql` | Consulta equivalente usando SQL manual parametrizado |
| GET | `/api/usuarios/:id` | Obtiene un usuario |
| GET | `/api/usuarios/:id/detalles` | Obtiene usuario y pedidos con `include` |
| POST | `/api/usuarios` | Crea usuario |
| PUT | `/api/usuarios/:id` | Actualiza usuario |
| DELETE | `/api/usuarios/:id` | Elimina usuario y sus pedidos en cascada |
| POST | `/api/usuarios/transaccion` | Crea usuario + pedido dentro de una transacción |

### Pedidos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pedidos` | Lista pedidos con usuario |
| GET | `/api/pedidos/:id` | Obtiene un pedido |
| POST | `/api/pedidos` | Crea pedido |
| PUT | `/api/pedidos/:id` | Actualiza pedido |
| DELETE | `/api/pedidos/:id` | Elimina pedido |

## Ejemplos de body

### Crear usuario

```json
{
  "nombre": "María López",
  "email": "maria@ejemplo.cl",
  "password": "clave123"
}
```

### Crear pedido

```json
{
  "usuarioId": 1,
  "producto": "Monitor",
  "cantidad": 1,
  "total": 89990,
  "estado": "pendiente"
}
```

### Transacción exitosa

```json
{
  "usuario": {
    "nombre": "Prueba Transacción",
    "email": "transaccion1@ejemplo.cl",
    "password": "clave123"
  },
  "pedido": {
    "producto": "Notebook",
    "cantidad": 1,
    "total": 450000,
    "estado": "pendiente"
  },
  "forzarError": false
}
```

### Demostrar ROLLBACK

Usa un correo distinto para no chocar con `unique` y cambia solamente:

```json
"forzarError": true
```

La terminal mostrará `TRANSACCIÓN ROLLBACK`. Luego verifica con `GET /api/usuarios` que ese usuario no fue guardado.

## Decisiones técnicas

### ¿Por qué PostgreSQL y pg?

PostgreSQL permite trabajar de forma sólida con relaciones, claves foráneas y transacciones. `pg` es el cliente habitual para conectar Node.js con PostgreSQL y permite usar consultas parametrizadas como `$1` para reducir el riesgo de SQL Injection.

### ¿Cómo se protegen los datos sensibles?

Las credenciales de la base de datos se almacenan en `.env`, que no se versiona. Las contraseñas de usuarios se transforman con bcrypt y el campo `passwordHash` no se incluye en las respuestas.

### ¿Por qué actualizar solo ciertos campos?

Solo se aceptan `nombre`, `email` y `password` para impedir que el cliente cambie campos internos como `id`, claves foráneas o fechas de auditoría.

### SQL manual vs ORM

`GET /api/usuarios/sql` usa `pg` con una consulta SQL parametrizada. `GET /api/usuarios` usa Sequelize. Ambos devuelven información equivalente. El ORM hace el código más legible y facilita relaciones, mientras SQL manual ofrece control fino sobre consultas complejas.

### Relación entre modelos

La aplicación implementa una relación **1:N**:

```text
Usuario 1 ---- N Pedido
```

Sequelize la define con `Usuario.hasMany(Pedido)` y `Pedido.belongsTo(Usuario)`. El endpoint `/api/usuarios/:id/detalles` utiliza `include` para devolver los pedidos del usuario en una sola consulta.

### Transacciones

`POST /api/usuarios/transaccion` crea un usuario y su primer pedido dentro de una transacción. Si ambas operaciones terminan correctamente se ejecuta `COMMIT`; si alguna falla se ejecuta `ROLLBACK`.

## Formato de respuestas

```json
{
  "status": "success",
  "message": "Usuarios obtenidos",
  "data": []
}
```

Los errores mantienen la misma estructura con `status: "error"`.

## Evidencias para la entrega

Revisa `evidencias/LEEME_CAPTURAS.md`. Allí se indica exactamente qué capturas tomar desde Postman, terminal y pgAdmin.

## GitHub

Este proyecto debe subirse como repositorio. Ejemplo:

```bash
git init
git add .
git commit -m "Proyecto Modulo 7 acceso a datos"
git branch -M main
git remote add origin TU_URL_DE_GITHUB
git push -u origin main
```

Nunca subas tu archivo `.env`.
