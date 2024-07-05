const express = require('express');
const { errors } = require('celebrate');

const authMiddleware = require('../middlewares/authMiddleware');
const reqValidation = require('../middlewares/validations/requestValidations');
const addValidation = require('../middlewares/validations/additionalValidations');
const gradeController = require('../controllers/gradeController');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .post(authMiddleware.restrictTo('admin', 'HR'), reqValidation.createGrade, addValidation.createGrade, gradeController.createGrade)
    .get(reqValidation.getGrade, gradeController.getGrade);

router.patch('/deactivate', authMiddleware.restrictTo('admin'), reqValidation.deleteGrade, addValidation.deleteGrade, gradeController.deleteGrade);

router.patch('/:id', authMiddleware.restrictTo('admin', 'HR'), reqValidation.updateGrade, addValidation.updateGrade, gradeController.updateGrade);

router.use(errors());

module.exports = router;