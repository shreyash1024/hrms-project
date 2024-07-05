const express = require('express');
const { errors } = require('celebrate');

const authMiddleware = require('../middlewares/authMiddleware');
const reqValidation = require('../middlewares/validations/requestValidations');
const addValidation = require('../middlewares/validations/additionalValidations');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .post(authMiddleware.restrictTo('admin', 'HR'), reqValidation.createDepartment, addValidation.createDepartment, departmentController.createDepartment)
    .get(reqValidation.getDepartment, departmentController.getDepartment);

router.patch('/deactivate', authMiddleware.restrictTo('HR'), reqValidation.deleteDepartment, addValidation.deleteDepartment, departmentController.deleteDepartment);

router.patch('/:id', authMiddleware.restrictTo('admin', 'HR'), reqValidation.updateDepartment, addValidation.updateDepartment, departmentController.updateDepartment);

router.use(errors());

module.exports = router;