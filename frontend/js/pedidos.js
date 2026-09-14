'use strict';
(() => {
  const app = window.Orbita;
  const orderPath = id => {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new Error('Pedido no válido.');
    return '/api/pedidos/' + Number(id);
  };
  app.pedidos = {
    list(page) { return app.request('/api/pedidos?limit=' + app.config.pageSize + '&offset=' + page * app.config.pageSize); },
    save(id, body) { return app.request(id === null ? '/api/pedidos' : orderPath(id), { method: id === null ? 'POST' : 'PUT', body }); },
    remove(id) { return app.request(orderPath(id), { method: 'DELETE' }); },
    validate(values) {
      const producto = values.producto.trim();
      const cantidad = Number(values.cantidad);
      const total = values.total;
      if (!producto || producto.length > 120) throw new Error('El producto debe tener entre 1 y 120 caracteres.');
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 2147483647) throw new Error('Ingresa una cantidad entera positiva.');
      if (!/^\d{1,10}(\.\d{1,2})?$/.test(total)) throw new Error('Ingresa un importe no negativo con hasta dos decimales.');
      if (!['pendiente', 'pagado', 'cancelado'].includes(values.estado)) throw new Error('Selecciona un estado válido.');
      return { producto, cantidad, total, estado: values.estado };
    }
  };
})();
