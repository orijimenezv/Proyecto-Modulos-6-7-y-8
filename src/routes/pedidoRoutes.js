const router = require('express').Router();
const controller = require('../controllers/pedidoController');
router.use(require('../middlewares/authMiddleware'));
router.get('/', controller.listar);
router.post('/', controller.crear);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);
module.exports = router;
