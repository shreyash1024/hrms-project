const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    category: String,
    weight: Number,
    level: Number,
    description: String,
    grade: { type: String, unique: true },
    active: { type: Boolean, default: true }
}, {
    versionKey: false
})

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade