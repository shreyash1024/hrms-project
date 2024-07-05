const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    employee: String,
    manager: String,
    leaveType: String,
    startDate: Date,
    endDate: Date,
    half: String,
    leaveDays: Number,
    reason: String,
    createdAt: { type: Date, default: Date.now() },
    action: String,
    actionAt: Date,
    isExpired: { type: Boolean, default: false }
}, {
    versionKey: false
})

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;