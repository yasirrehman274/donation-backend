const router = require('express').Router();
const userController = require('../controllers/userController');
const userValidation = require('../validations/userValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', userValidation.listUsersValidation, validate, userController.index);
router.get('/:id', userValidation.idParamValidation(), validate, userController.show);
router.post('/', userValidation.createUserValidation, validate, userController.store);
router.put('/:id', userValidation.updateUserValidation, validate, userController.update);
router.delete('/:id', userValidation.idParamValidation(), validate, userController.destroy);

module.exports = router;
