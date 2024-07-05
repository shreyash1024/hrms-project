const EmpLeave = require('../models/empLeaveModel');

exports.addLeavesBack = async (leaveRequest) => {
    try {
        const empLeave = await EmpLeave.findOne({ email: leaveRequest.employee });
        const leaveDays = leaveRequest.half ? 0.5 : (leaveRequest.endDate - leaveRequest.startDate) / (1000 * 60 * 60 * 24) + 1;
        empLeave[leaveRequest.leaveType] += leaveDays;
        await empLeave.save();
    } catch (err) {
        console.log(err);
    }
}