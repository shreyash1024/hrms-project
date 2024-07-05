const Grade = require('../models/gradeModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.createGrade = catchAsync(async (req, res, next) => {
    const grade = await Grade.create(req.grade);

    res.status(200).json({
        status: 'success',
        message: 'New grade created!',
        grade
    })
})

exports.getGrade = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(Grade.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const grades = await features.query;

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: {
            grades
        }
    })
})

exports.updateGrade = catchAsync(async (req, res, next) => {
    Object.assign(req.grade, req.body);
    const grade = await req.grade.save();

    res.status(200).json({
        status: 'success',
        message: 'Grade updated!',
        grade
    })
})

exports.deleteGrade = catchAsync(async (req, res, next) => {
    req.grade.active = false;
    const grade = await req.grade.save();

    res.status(200).json({
        status: 'success',
        message: 'Grade deactivated!',
        grade
    })
})