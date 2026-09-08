const router = require('express').Router();
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No se recibió ningún archivo',
      data: null
    });
  }

  res.json({
    status: 'success',
    message: 'Archivo subido correctamente',
    data: {
      nombre: req.file.filename,
      ruta: `/public/uploads/${req.file.filename}`
    }
  });
});

module.exports = router;