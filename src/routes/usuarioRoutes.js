const router = require('express').Router();
const controller = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/sql', controller.listarSQL);
router.post('/transaccion', controller.transaccion);
router.get('/:id/detalles', controller.detalles);
router.get('/', controller.listar);
router.post('/', controller.crear);
router.get('/:id', controller.obtener);
router.put('/:id', verificarToken, controller.actualizar);
router.delete('/:id', verificarToken, controller.eliminar);
module.exports = router;
