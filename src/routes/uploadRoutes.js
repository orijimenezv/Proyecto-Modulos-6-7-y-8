const router = require('express').Router();
const upload = require('../middlewares/uploadMiddleware');
const auth = require('../middlewares/authMiddleware');
const storage = require('../services/storageService');
const limit = require('../middlewares/rateLimit')({ limit: 20 });
router.post('/upload', auth, limit, (req, res, next) => {
  try { storage.assertAvailable(); next(); } catch (error) { next(error); }
}, upload.single('archivo'), async (req, res, next) => {
  try { res.status(201).json({ status: 'success', message: 'Archivo subido', data: await storage.save(req.file, req.usuario.id) }); }
  catch (error) { next(error); }
});
router.get('/api/archivos/:nombre', auth, async (req, res, next) => {
  try {
    const buffer = await storage.read(req.params.nombre, req.usuario.id);
    res.setHeader('Content-Disposition', 'attachment; filename="' + req.params.nombre + '"');
    res.type(req.params.nombre.endsWith('.png') ? 'png' : 'jpg').send(buffer);
  } catch (error) { next(error); }
});
module.exports = router;
