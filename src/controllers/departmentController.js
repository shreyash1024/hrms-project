const Department = require('../models/departmentModel');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.createDepartment = catchAsync(async (req, res, next) => {
    const department = Department.create(req.body);

    res.status(200).json({
        status: 'success',
        message: 'New department created!',
        department
    })
})

exports.getDepartment = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(Department.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const departments = await features.query;

    res.status(200).json({
        status: 'success',
        results: departments.length,
        data: {
            departments
        }
    })
})

exports.updateDepartment = catchAsync(async (req, res, next) => {
    Object.assign(req.department, req.body);
    const department = await req.department.save();

    res.status(200).json({
        status: 'success',
        message: 'Department updated!',
        department
    })
})

exports.deleteDepartment = catchAsync(async (req, res, next) => {
    req.department.active = false;
    const department = await req.department.save();

    res.status(200).json({
        status: 'success',
        message: 'Department deactivated!',
        department
    })
})