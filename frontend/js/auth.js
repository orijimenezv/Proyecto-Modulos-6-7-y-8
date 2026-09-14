'use strict';
(() => {
  const app = window.Orbita;
  app.auth = {
    async login(email, password) {
      const data = await app.request('/login', { method: 'POST', authenticated: false, body: { email: email.trim(), password } });
      if (typeof data?.token !== 'string' || !data.token) throw new Error('No se pudo iniciar la sesión.');
      app.session.set(data.token);
    },
    register(nombre, email, password) {
      if (nombre.trim().length < 2) throw new Error('Ingresa un nombre de al menos 2 caracteres.');
      if (password.length < 8 || new TextEncoder().encode(password).length > 72) throw new Error('La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.');
      return app.request('/api/usuarios', { method: 'POST', authenticated: false, body: { nombre: nombre.trim(), email: email.trim(), password } });
    },
    async profile() {
      const users = await app.request('/api/usuarios?limit=1');
      if (!Array.isArray(users) || !users[0]) throw new Error('No se pudo obtener tu perfil.');
      return users[0];
    }
  };
})();
