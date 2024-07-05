const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    department: { type: String },
    grade: { type: String },
    active: { type: Boolean, default: true }
}, {
    versionKey: false
})

const Designation = mongoose.model('Designation', designationSchema);

module.exports = Designation;