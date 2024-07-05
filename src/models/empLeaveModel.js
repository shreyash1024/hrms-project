const mongoose = require('mongoose');

const empLeaveSchema = new mongoose.Schema({
    email: String,
    PL: Number,
    SL: Number,
    CL: Number,
    count: Number,
    joiningDate: Date,
    probationEnd: Date,
}, {
    versionKey: false
})

const EmpLeave = mongoose.model('EmpLeave', empLeaveSchema);

module.exports = EmpLeave;