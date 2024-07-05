const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

const Active = require('../models/activeModel');

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401));
    }

    let decoded = null;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        const error = JSON.parse(JSON.stringify(err));
        if (error.name === 'TokenExpiredError') {
            await Active.findOneAndDelete({ token });
        }
        return next(err);
    }

    const currentUser = await User.findById(decoded.id).select('+active +password');
    if (!currentUser)
        return next(new AppError('User not found in db!', 400));

    if (!currentUser.active)
        return next(new AppError('Deleted user does not have access to the system!', 401));

    const activeUser = await Active.findOne({ token });
    if (!activeUser)
        return next(new AppError('You are not logged in! Please log in to get access', 401));

    currentUser.token = token;
    req.user = currentUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError('You do not have permission to perform this task!', 401));

        next();
    }
}
