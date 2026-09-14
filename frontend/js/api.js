'use strict';
(() => {
  const app = window.Orbita;
  app.session = {
    get() { try { return sessionStorage.getItem(app.config.tokenKey); } catch { return null; } },
    set(token) { try { sessionStorage.setItem(app.config.tokenKey, token); } catch { throw new Error('Activa el almacenamiento de sesión del navegador para iniciar sesión.'); } },
    clear() { try { sessionStorage.removeItem(app.config.tokenKey); } catch { /* Sin sesión persistida disponible. */ } }
  };
  app.request = async (path, { method = 'GET', body, authenticated = true } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = authenticated ? app.session.get() : null;
    if (token) headers.Authorization = 'Bearer ' + token;
    try {
      const response = await fetch(app.config.apiUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' });
      if (response.status === 401) {
        app.session.clear();
        window.dispatchEvent(new Event('session-expired'));
        throw new Error(authenticated ? 'Tu sesión terminó. Inicia sesión nuevamente.' : 'Email o contraseña incorrectos.');
      }
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        // Mensajes locales: nunca representar respuestas internas que pudieran contener detalles sensibles.
        const messages = { 400: 'Revisa los datos ingresados.', 403: 'Acceso no permitido. Revisa el origen autorizado de la aplicación.', 404: 'Este pedido ya no está disponible. Actualiza la lista.', 409: 'Ya existe una cuenta con ese email.', 429: 'Demasiados intentos. Espera unos minutos antes de continuar.' };
        throw new Error(messages[response.status] || 'El servicio no pudo completar la operación. Intenta más tarde.');
      }
      if (!payload || !Object.hasOwn(payload, 'data')) throw new Error('El servicio devolvió una respuesta inesperada.');
      return payload.data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Actualiza antes de repetir una operación para evitar duplicados.');
      if (error instanceof TypeError) throw new Error('No se pudo conectar con la API. Revisa tu conexión y la configuración CORS del origen.');
      throw error;
    } finally { clearTimeout(timer); }
  };
})();
