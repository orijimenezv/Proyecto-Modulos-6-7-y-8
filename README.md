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