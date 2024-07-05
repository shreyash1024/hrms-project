const express = require('express');

const userRouter = require('./userRoutes');
const leaveRequestRouter = require('./leaveRequestRoutes');
const departmentRouter = require('./departmentRoutes');
const gradeRouter = require('./gradeRoutes');
const designationRouter = require('./designationRoutes');

const router = express.Router();

router.use('/users', userRouter);
router.use('/leaveRequests', leaveRequestRouter);
router.use('/departments', departmentRouter);
router.use('/grades', gradeRouter);
router.use('/designations', designationRouter);

module.exports = router;