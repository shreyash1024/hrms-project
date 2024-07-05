const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    description: { type: String },
    active: { type: Boolean, default: true }
}, {
    versionKey: false
})

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;