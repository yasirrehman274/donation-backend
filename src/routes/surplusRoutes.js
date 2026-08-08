const router = require('express').Router();
const surplusController = require('../controllers/surplusController');
const surplusValidation = require('../validations/surplusValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', surplusController.index);
router.get('/:id', surplusController.show);
router.post('/', surplusValidation.storeSurplusValidation, validate, surplusController.store);
router.put('/:id', surplusValidation.updateSurplusValidation, validate, surplusController.update);
router.delete('/:id', surplusController.destroy);

module.exports = router;
