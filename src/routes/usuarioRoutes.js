const router = require('express').Router();
const controller = require('../controllers/usuarioController');
const auth = require('../middlewares/authMiddleware');
const owner = require('../middlewares/ownerMiddleware');
const rateLimit = require('../middlewares/rateLimit');
const registrationLimit = rateLimit({ limit: require('../config/env').loadConfig().registrationLimit });
// Registro público: solo crea una cuenta nueva, nunca recursos de cuentas existentes.
router.post('/', registrationLimit, controller.crear);
router.post('/transaccion', registrationLimit, controller.transaccion);
router.use(auth);
router.get('/sql', controller.listarSQL);
router.get('/', controller.listar);
router.get('/:id/detalles', owner, controller.detalles);
router.get('/:id', owner, controller.obtener);
router.put('/:id', owner, controller.actualizar);
router.delete('/:id', owner, controller.eliminar);
module.exports = router;
