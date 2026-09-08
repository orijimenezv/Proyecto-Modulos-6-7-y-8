const router = require('express').Router();
const controller = require('../controllers/usuarioController');

router.get('/sql', controller.listarSQL);
router.post('/transaccion', controller.transaccion);
router.get('/:id/detalles', controller.detalles);
router.get('/', controller.listar);
router.post('/', controller.crear);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
