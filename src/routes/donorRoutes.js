const router = require('express').Router();
const donorController = require('../controllers/donorController');
const donorValidation = require('../validations/donorValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', donorController.index);
router.get('/:id', donorController.show);
router.post('/', donorValidation.storeDonorValidation, validate, donorController.store);
router.put('/:id', donorValidation.updateDonorValidation, validate, donorController.update);
router.delete('/:id', donorController.destroy);

module.exports = router;
