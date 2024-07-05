const Designation = require('../models/designationModel');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.createDesignation = catchAsync(async (req, res, next) => {
    const designation = await Designation.create(req.body);

    res.status(201).json({
        status: 'success',
        message: 'New designation created!',
        designation
    })
})

exports.updateDesignation = catchAsync(async (req, res, next) => {
    req.designation.name = req.body.name;
    const designation = await req.designation.save();

    res.status(200).json({
        status: 'success',
        message: 'Designation updated!',
        designation
    });
});

exports.getDesignation = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(Designation.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const designations = await features.query;

    res.status(200).json({
        status: 'success',
        results: designations.length,
        data: {
            designations
        }
    })
})


exports.deleteDesignation = catchAsync(async (req, res, next) => {
    req.designation.active = false;
    const designation = await req.designation.save();

    res.status(200).json({
        status: 'success',
        message: 'Designation deactivated!',
        designation
    })
})