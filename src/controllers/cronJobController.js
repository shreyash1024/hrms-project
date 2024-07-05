const dayjs = require('dayjs');
const catchAsync = require('../utils/catchAsync');
const EmpLeave = require('../models/empLeaveModel');
const LeaveRequest = require('../models/leaveRequestModel');
const { addLeavesBack } = require('../services/leaveRequestService');

exports.dailyCronJob = catchAsync(async () => {
    // addMonthlyPL
    await EmpLeave.updateMany({ joiningDate: { $lt: dayjs() } }, { $inc: { count: 1 } });
    await EmpLeave.updateMany({ count: 31 }, { $inc: { PL: 1.5 }, count: 0 });

    // set expire leave request
    const expiredLeaveRequests = await LeaveRequest.find({ startDate: dayjs().startOf('day').subtract(1, 'day'), action: { $exists: false } });
    expiredLeaveRequests.forEach(async leaveRequest => {
        try {
            leaveRequest.isExpired = true;
            await addLeavesBack(leaveRequest);
        } catch (err) {
            next(err);
        }
    })
})

exports.resetYearlyLeaves = catchAsync(async () => {
    await EmpLeave.updateMany({}, {
        $min: { PL: 30 },
        SL: 6,
        CL: 6
    });
})