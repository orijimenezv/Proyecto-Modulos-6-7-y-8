'use strict';
(() => {
  const app = window.Orbita;
  const $ = id => document.getElementById(id);
  let page = 0, orders = [], editing = null, deleting = null, busy = false;
  function notice(message = '', error = false) {
    $('notice').textContent = message;
    $('notice').hidden = !message;
    $('notice').classList.toggle('error', error);
  }
  function view(name) {
    $('home').hidden = name !== 'home';
    $('access').hidden = !['login', 'register'].includes(name);
    $('dashboard').hidden = name !== 'dashboard';
    $('logout').hidden = name !== 'dashboard';
    $('login-form').hidden = name !== 'login';
    $('register-form').hidden = name !== 'register';
    $('access-title').textContent = name === 'register' ? 'Crear tu cuenta' : 'Iniciar sesión';
    $('access-description').textContent = name === 'register' ? 'Un nuevo espacio para tus pedidos.' : 'Qué bueno tenerte de vuelta.';
    notice();
    $(name === 'home' ? 'hero-title' : name === 'dashboard' ? 'dashboard-title' : 'access-title').focus();
  }
  function pagination() {
    $('previous').disabled = busy || page === 0;
    $('next').disabled = busy || orders.length < app.config.pageSize || (page + 1) * app.config.pageSize > 100000;
  }
  async function run(work, errorTarget) {
    if (busy) return;
    busy = true;
    const controls = [...document.querySelectorAll('button, fieldset')];
    controls.forEach(control => { control.disabled = true; });
    $('main').setAttribute('aria-busy', 'true');
    notice('Procesando…');
    if (errorTarget) $(errorTarget).textContent = '';
    try { await work(); } catch (error) {
      notice(error.message, true);
      if (errorTarget) $(errorTarget).textContent = error.message;
    } finally {
      busy = false;
      controls.forEach(control => { control.disabled = false; });
      $('main').removeAttribute('aria-busy');
      pagination();
    }
  }
  function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (className) node.className = className;
    return node;
  }
  function render() {
    $('orders').replaceChildren();
    $('empty').hidden = orders.length !== 0;
    $('page-number').textContent = 'Página ' + (page + 1);
    $('page-description').textContent = orders.length + (orders.length === 1 ? ' pedido' : ' pedidos') + ' en esta página · importes sin moneda definida';
    for (const order of orders) {
      const card = element('article', undefined, 'order-card');
      const top = element('div', undefined, 'card-top');
      const state = ['pendiente', 'pagado', 'cancelado'].includes(order.estado) ? order.estado : 'desconocido';
      top.append(element('span', '#' + order.id, 'order-id'), element('span', state, 'badge ' + state));
      const details = element('dl');
      for (const [label, value] of [['Cantidad', order.cantidad], ['Importe total', new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(order.total))]]) {
        const group = element('div'); group.append(element('dt', label), element('dd', value)); details.append(group);
      }
      const actions = element('div', undefined, 'card-actions');
      const edit = element('button', 'Editar', 'button ghost');
      edit.setAttribute('aria-label', 'Editar pedido ' + order.producto);
      edit.addEventListener('click', () => openOrder(order));
      const remove = element('button', 'Eliminar', 'button ghost delete-button');
      remove.setAttribute('aria-label', 'Eliminar pedido ' + order.producto);
      remove.addEventListener('click', () => {
        if (busy) return;
        deleting = order.id;
        $('delete-description').textContent = 'Se eliminará «' + order.producto + '» de tus pedidos.';
        $('delete-error').textContent = '';
        $('delete-dialog').showModal(); $('cancel-delete').focus();
      });
      actions.append(edit, remove); card.append(top, element('h3', order.producto), details, actions); $('orders').append(card);
    }
    pagination();
  }
  async function loadOrders() {
    const result = await app.pedidos.list(page);
    if (!Array.isArray(result)) throw new Error('No se pudo interpretar la lista de pedidos.');
    orders = result;
    if (!orders.length && page > 0) { page--; return loadOrders(); }
    render();
  }
  async function dashboard() {
    const user = await app.auth.profile();
    $('user-name').textContent = user.nombre;
    page = 0;
    view('dashboard');
    await loadOrders(); notice();
  }
  function logout() {
    app.session.clear(); orders = []; page = 0; $('orders').replaceChildren(); $('user-name').textContent = 'bienvenido';
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.querySelectorAll('form').forEach(form => form.reset());
    view('login');
  }
  function openOrder(order) {
    if (busy) return;
    editing = order ? order.id : null;
    $('order-form').reset();
    $('order-title').textContent = order ? 'Editar pedido' : 'Nuevo pedido';
    $('product').value = order?.producto || '';
    $('quantity').value = order?.cantidad ?? 1;
    $('total').value = order?.total ?? '';
    $('state').value = order?.estado || 'pendiente';
    $('order-error').textContent = '';
    $('order-dialog').showModal(); $('product').focus();
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { if (!busy) view(button.dataset.view); }));
  window.addEventListener('session-expired', logout);
  $('logout').addEventListener('click', () => { if (!busy) { logout(); notice('Sesión cerrada. Hasta la próxima.'); } });
  $('login-form').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      try { await app.auth.login($('login-email').value, $('login-password').value); await dashboard(); }
      finally { $('login-password').value = ''; }
    });
  });
  $('register-form').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const email = $('register-email').value;
      try { await app.auth.register($('register-name').value, email, $('register-password').value); }
      finally { $('register-password').value = ''; }
      $('register-form').reset(); view('login'); $('login-email').value = email;
      notice('Cuenta creada. Ya puedes iniciar sesión.');
    });
  });
  $('new-order').addEventListener('click', () => openOrder(null));
  $('close-order').addEventListener('click', () => $('order-dialog').close());
  $('cancel-delete').addEventListener('click', () => $('delete-dialog').close());
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); }));
  $('order-form').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const values = { producto: $('product').value, cantidad: $('quantity').value, total: $('total').value, estado: $('state').value };
      await app.pedidos.save(editing, app.pedidos.validate(values));
      $('order-dialog').close();
      notice('Pedido guardado.');
      try { await loadOrders(); } catch { notice('Pedido guardado, pero no se pudo actualizar la lista. Pulsa Actualizar.', true); }
    }, 'order-error');
  });
  $('delete-form').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      await app.pedidos.remove(deleting); $('delete-dialog').close(); notice('Pedido eliminado.');
      try { await loadOrders(); } catch { notice('Pedido eliminado, pero no se pudo actualizar la lista. Pulsa Actualizar.', true); }
    }, 'delete-error');
  });
  $('refresh').addEventListener('click', () => run(async () => { await loadOrders(); notice('Lista actualizada.'); }));
  function changePage(delta) {
    run(async () => { const before = page; page += delta; try { await loadOrders(); notice(); } catch (error) { page = before; throw error; } });
  }
  $('previous').addEventListener('click', () => changePage(-1));
  $('next').addEventListener('click', () => changePage(1));
  if (app.session.get()) run(dashboard); else view('home');
})();
