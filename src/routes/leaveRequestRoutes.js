const express = require('express');
const { errors } = require('celebrate');

const reqValidation = require('../middlewares/validations/requestValidations');
const addValidation = require('../middlewares/validations/additionalValidations');
const leaveRequestController = require('../controllers/leaveRequestController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect)

router
    .route('/')
    .post(reqValidation.createLeaveRequest, addValidation.createLeaveRequest, leaveRequestController.createLeaveRequest)

router.use(authMiddleware.restrictTo('HR', 'employee'))

router.patch('/action/:leaveId', reqValidation.leaveRequestAction, addValidation.leaveRequestAction, leaveRequestController.leaveRequestAction);

router.delete('/:leaveId', reqValidation.deleteLeaveRequest, addValidation.deleteLeaveRequest, leaveRequestController.deleteLeaveRequest);

router.get('/myLeaves', leaveRequestController.myLeaves);

router.get('/:user?', reqValidation.getLeaveRequest, addValidation.getLeaveRequest, leaveRequestController.getLeaveRequest);

router.use(errors());

module.exports = router;