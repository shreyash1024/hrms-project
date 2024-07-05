const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs')

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Active = require('../models/activeModel');
const ApiFeatures = require('../utils/apiFeatures');
const EmpLeave = require('../models/empLeaveModel');

const setEmpLeaves = catchAsync(async (user) => {
    const probationEnd = dayjs(user.joiningDate).add('6', 'months');

    await EmpLeave.create({
        email: user.email,
        PL: 0,
        SL: 6,
        CL: 6,
        count: 0,
        joiningDate: user.joiningDate,
        probationEnd
    })
})

exports.registration = catchAsync(async (req, res, next) => {
    req.body.password = await bcrypt.hash(req.body.password, 12);
    req.body.passwordConfirm = undefined;
    req.body.createdAt = dayjs().startOf('day');
    const newUser = await User.create(req.body);

    newUser.password = undefined;
    newUser.active = undefined;

    await setEmpLeaves(newUser);

    res.status(200).json({
        status: 'success',
        user: newUser
    })
})

exports.login = catchAsync(async (req, res, next) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY_IN
    });

    await Active.create({ email: req.user.email, token });

    res.status(200).json({
        status: 'success',
        token
    })
})

exports.logOut = catchAsync(async (req, res, next) => {
    await Active.findOneAndDelete({ token: req.user.token });

    res.status(200).json({
        status: 'success',
        message: 'logged out!'
    })
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const resetToken = req.user.createPasswordResetToken();
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        passwordResetToken: resetToken
    })
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    req.user.password = await bcrypt.hash(req.body.password, 12);
    req.user.passwordConfirm = undefined;
    req.user.passwordResetToken = undefined;
    req.user.passwordResetExpires = undefined;
    await Promise.all([
        req.user.save(),
        Active.deleteMany({ email: req.user.email })
    ])

    res.status(200).json({
        status: 'success',
        message: 'Password reseted!'
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    req.user.password = await bcrypt.hash(req.body.password, 12);
    req.user.passwordConfirm = undefined;
    await Promise.all([
        req.user.save(),
        Active.deleteMany({ email: req.user.email })
    ])

    res.status(200).json({
        status: 'success',
        message: 'password updated!'
    });
})


exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        message: 'user updated!',
        user
    })
})

exports.updateEmpGrade = catchAsync(async (req, res, next) => {
    req.employee.user.grade = req.employee.grade;
    req.employee.user.designation = req.employee.designation;
    if (req.body.manager)
        req.employee.user.manager = req.employee.manager;
    req.employee.user.gradeUpdateRecent = dayjs().startOf('D');

    const user = await req.employee.user.save();

    res.status(200).json({
        status: 'success',
        message: `user ${req.body.action === 'promotion' ? 'promoted' : 'demoted'} | grade: ${user.grade} | designation: ${user.designation}`
    })
});

exports.getUser = catchAsync(async (req, res, next) => {
    const feature = new ApiFeatures(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const users = await feature.query;

    if (!users)
        return next(new AppError('No user found!', 404));

    res.status(200).json({
        status: 'success',
        results: users.length,
        users
    })
});

exports.getMe = (req, res, next) => {
    req.query._id = req.user.id;
    next();
}

exports.deleteUser = catchAsync(async (req, res, next) => {
    await Promise.all([
        User.findByIdAndUpdate(req.params.id, { active: false }),
        User.updateMany({ manager: req.deleteUser.email }, { manager: undefined }),
        Active.deleteMany({ email: req.deleteUser.email })
    ])

    res.status(200).json({
        status: 'success',
        message: 'user deleted!',
        user: req.deleteUser
    })
})

exports.setManager = catchAsync(async (req, res, next) => {
    await User.updateOne({ email: req.body.employee }, { manager: req.body.manager });

    res.status(200).json({
        status: 'success',
        message: 'Manager is assigned to an employee!'
    })
})