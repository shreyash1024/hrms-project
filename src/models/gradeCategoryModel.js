const mongoose = require('mongoose');

const gradeCategorySchema = new mongoose.Schema({
    category: { type: String, unique: true },
    weight: { type: Number, unique: true }
}, {
    versionKey: false
})

const gradeCategoryModel = mongoose.model('gradeCategory', gradeCategorySchema);

module.exports = gradeCategoryModel;