const express = require('express');
const { errors } = require('celebrate');

const authMiddleware = require('../middlewares/authMiddleware');
const reqValidation = require('../middlewares/validations/requestValidations');
const addValidation = require('../middlewares/validations/additionalValidations');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', reqValidation.login, addValidation.login, userController.login);
router.post('/forgotPassword', reqValidation.forgotPassword, addValidation.forgotPassword, userController.forgotPassword);
router.patch('/resetPassword/:token', reqValidation.resetPassword, addValidation.resetPassword, userController.resetPassword);

router.use(authMiddleware.protect);
router.post('/registration', authMiddleware.restrictTo('admin', 'HR'), reqValidation.registration, addValidation.registration, userController.registration);
router.patch('/updateMyPassword', reqValidation.updatePassword, addValidation.updatePassword, userController.updatePassword);
router.get('/', authMiddleware.restrictTo('admin', 'HR'), userController.getUser);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/setManager', authMiddleware.restrictTo('admin', 'HR'), reqValidation.setManager, addValidation.setManager, userController.setManager);
router.patch('/updateEmpGrade', authMiddleware.restrictTo('admin', 'HR'), reqValidation.updateEmpGrade, addValidation.updateEmpGrade, userController.updateEmpGrade);
router.patch('/delete/:id', authMiddleware.restrictTo('admin'), reqValidation.deleteUser, userController.deleteUser)
router.delete('/logout', userController.logOut);
router.patch(authMiddleware.restrictTo('admin'), reqValidation.updateUser, addValidation.updateUser, userController.updateUser)

router.use(errors());               

module.exports = router;