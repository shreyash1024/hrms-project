const express = require('express');
const { errors } = require('celebrate');

const reqValidation = require('../middlewares/validations/requestValidations');
const addValidation = require('../middlewares/validations/additionalValidations');
const designationController = require('../controllers/designationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .post(authMiddleware.restrictTo('admin', 'HR'), reqValidation.createDesignation, addValidation.createDesignation, designationController.createDesignation)
    .get(reqValidation.getDesignation, designationController.getDesignation);

router.patch('/deactivate', authMiddleware.restrictTo('admin'), reqValidation.deleteDesignation, addValidation.deleteDesignation, designationController.deleteDesignation);

router.patch('/:id', authMiddleware.restrictTo('admin', 'HR'), reqValidation.updateDesignation, addValidation.updateDesignation, designationController.updateDesignation);

router.use(errors());

module.exports = router;