const crypto = require('crypto');
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const Department = require('../../models/departmentModel');
const Designation = require('../../models/designationModel');
const Grade = require('../../models/gradeModel');
const User = require('../../models/userModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Active = require('../../models/activeModel');
const userService = require('../../services/userService');
const GradeCategory = require('../../models/gradeCategoryModel');
const EmpLeave = require('../../models/empLeaveModel');
const LeaveRequest = require('../../models/leaveRequestModel');

dayjs.extend(customParseFormat);

exports.registration = catchAsync(async (req, res, next) => {
    if (!dayjs(req.body.joiningDate, 'YYYY-MM-DD', true).isValid() || !dayjs(req.body.dob, 'YYYY-MM-DD', true).isValid())
        return next(new AppError('Please provide valid date in "YYYY-MM-DD" format!', 400));

    req.body.joiningDate = dayjs(req.body.joiningDate);
    req.body.dob = dayjs(req.body.dob).format();

    if (req.user.role === 'admin' && req.body.role !== 'HR')
        return next(new AppError('admin can only onboard HR managers!', 400));

    if (req.body.role === 'HR' && req.body.department !== 'HR')
        return next(new AppError('Only HR department will have HR role', 400));

    const [emailExists, phoneExists, departmentExists, gradeExists, designation] =
        await Promise.all([
            User.exists({ email: req.body.email }),
            User.exists({ phone: req.body.phone }),
            Department.exists({ name: req.body.department }),
            Grade.exists({ grade: req.body.grade }),
            Designation.findOne({
                name: req.body.designation,
                department: req.body.department,
                grade: req.body.grade,
            }),
        ]);
    if (emailExists)
        return next(new AppError('Duplicate email! User with provided email already exists!', 400));

    if (phoneExists)
        return next(new AppError('Duplicate phone! User with provided phone number already exists!', 400));

    if (!departmentExists)
        return next(new AppError('No such department exists!', 400));

    if (!gradeExists) return next(new AppError('No such grade exists!', 400));

    if (!designation)
        return next(new AppError('No such designation with given department and grade exists!', 400));

    next();
});

exports.login = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email }).select('+password +active');

    const [isCorrectPassword, actives] = await Promise.all([
        user?.correctPassword(req.body.password, user?.password),
        Active.find({ email: user?.email }),
    ]);
    if (!user || !isCorrectPassword)
        return next(new AppError('Incorrect email or password!', 400));

    if (user.joiningDate > dayjs())
        return next(new AppError('User can not login before joinngDate!', 401));

    if (!user.active)
        return next(new AppError('Deleted user cannot login to the system!', 401));

    if (actives.length === 3)
        return next(new AppError('Can not use more than 3 sessions', 400));

    req.user = {
        id: user.id,
        email: user.email,
    };

    next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user)
        return next(new AppError('There is no user with that email address', 404));

    if (!user.active) return next(new AppError('Deleted User!', 401));

    req.user = user;

    next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Token is invalid or expired!', 400));
    }
    if (!user.active)
        return next(new AppError('Can not reset password of deleted user!', 400));

    req.user = user;

    next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    if (!(await req.user.correctPassword(req.body.passwordCurrent, req.user.password)))
        return next(new AppError('Your current password is wrong', 401));

    next();
});

exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found with given id!', 401));

    if (!user.active)
        return next(new AppError('Can not update deleted employee!', 400));

    if (req.body.phone) {
        if (await User.exists({ phone: req.body.phone }))
            return next(new AppError('Duplicate phone! User with provided phone number already exists!', 400));
    }

    next();
});

exports.updateEmpGrade = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    let manager;

    if (!user) return next(new AppError('User not found with given id!', 404));

    if (!user.active)
        return next(new AppError('Can not update deleted employee!', 400));

    if (user.gradeUpdateRecent)
        if (dayjs().startOf('D') > dayjs(`${user.gradeUpdateRecent}`).add(6, 'M'))
            return next(new AppError('User is recently promoted. User can be promoted after 6 months of last promotion date!', 400));

    const userGrade = await Grade.findOne({ grade: user.grade });
    const currentGradeCategory = await GradeCategory.findOne({ category: userGrade.category, });

    let newGrade;
    if (req.body.action === 'promotion') {
        newGrade = await Grade.findOne({
            category: userGrade.category,
            level: userGrade.level + 1,
        });
        if (!newGrade) {
            const newGradeCategory = await GradeCategory.findOne({ weight: currentGradeCategory.weight + 1, });
            if (!newGradeCategory)
                return next(new AppError('Can not further promote the employee!', 400));

            newGrade = await Grade.findOne({ category: newGradeCategory.category, level: 1, });
            if (!newGrade)
                return next(new AppError('New category grade not found!', 400));
        }
    } else if (req.body.action === 'demotion') {
        newGrade = await Grade.findOne({ category: userGrade.category, level: userGrade.level - 1, });
        if (!newGrade) {
            const newGradeCategory = await GradeCategory.findOne({ weight: currentGradeCategory.weight - 1, });
            if (!newGradeCategory)
                return next(new AppError('Can not further demote the employee!', 400));

            const newGrades = await Grade.find({ category: newGradeCategory.category, }).sort('-level');
            if (!newGrades)
                return next(new AppError('New category grade not found!', 400));
            newGrade = newGrades[0];
        }
    }

    const employees = await User.find({ manager: req.body.email });
    if (employees) {
        for (let employee of employees) {
            const empGrade = await Grade.findOne({ grade: employee.grade });
            if (!await userService.isValidManager(empGrade, newGrade))
                return next(new AppError('Employees => TS/S grade category employee can have manager of M grade category & M grade category employee can have manager of G grade category!', 400));
        }
    }

    if (!newGrade)
        return next(new AppError(`Can not ${req.body.action === 'promotion' ? 'promote' : 'demote'} employee, new grade does not exist!`, 400));

    const designation = await Designation.findOne({
        department: user.department,
        grade: newGrade.grade,
    });
    if (!designation || !designation.active)
        return next(new AppError(`Designation not found for "${user.department}" department and "${newGrade.grade}" grade!`, 400));

    if (req.body.manager) {
        manager = await User.findOne({ email: req.body.manager });
        if (!manager)
            return next(new AppError('user not found for given manager email', 404));
        if (!manager.active)
            return next(new AppError('Can not assign deleted user as manager!', 400));
        const managerGrade = await Grade.findOne({ grade: manager.grade });
        if (!(await userService.isValidManager(newGrade, managerGrade)))
            return next(new AppError('Manager => TS/S grade category employee can have manager of M grade category & M grade category employee can have manager of G grade category!', 400));
    } else if (user.manager) {
        const userManager = await User.findOne({ email: user.manager });
        const managerGrade = await Grade.findOne({ grade: userManager.grade });
        if (!(await userService.isValidManager(newGrade, managerGrade)))
            return next(new AppError('Manager => TS/S grade category employee can have manager of M grade category & M grade category employee can have manager of G grade category!', 400));
    }

    req.employee = {
        user,
        grade: newGrade.grade,
        manager: manager?.email,
        designation: designation.name,
    };
    next();
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) return next(new AppError('No user find with that id'));

    if (!user.active) return next(new AppError('User already deleted!', 400));

    req.deleteUser = user;
    next();
});

exports.setManager = catchAsync(async (req, res, next) => {
    const [employee, manager] = await Promise.all([
        User.findOne({ email: req.body.employee }).select('+active'),
        User.findOne({ email: req.body.manager }).select('+active'),
    ]);

    if (!employee || !manager)
        return next(new AppError('Employee or manager does not found!', 404));

    if (!employee.active || !manager.active)
        return next(new AppError('Can not perform action on Deleted user', 401));

    if (employee.department !== manager.department)
        return next(
            new AppError('Departments of manager and employee must be same!', 400)
        );

    const [employeeGrade, managerGrade] = await Promise.all([
        Grade.findOne({ grade: employee.grade }),
        Grade.findOne({ grade: manager.grade }),
    ]);

    if (!(await userService.isValidManager(employeeGrade, managerGrade)))
        return next(
            new AppError(
                'TS/S grade category employee can have manager of M grade category & M grade category employee can have manager of G grade category!',
                400
            )
        );

    next();
});

exports.createDepartment = catchAsync(async (req, res, next) => {
    if (await Department.exists({ name: req.body.name })) {
        return next(new AppError('Duplicate department!', 400));
    }
    next();
});

exports.updateDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.findById(req.params.id);

    if (!department)
        return next(new AppError('No department found with given id!', 404));

    if (!department.active)
        return next(new AppError('Can not update deleted department', 400));

    if (req.body.name) {
        if (await Department.exists({ name: req.body.name })) {
            return next(new AppError('Duplicate department!', 400));
        }
    }
    req.department = department;
    next();
});

exports.deleteDepartment = catchAsync(async (req, res, next) => {
    const department = await Department.findOne({ name: req.body.department });
    if (!department) return next(new AppError('Department not found!', 404));

    if (!department.active)
        return next(new AppError('Department already deleted!', 400));

    const [userBelong, designationBelong] = await Promise([
        User.exists({ department: req.body.department }),
        Designation.exists({ department: req.body.department }),
    ]);
    if (userBelong)
        return next(new AppError('Department is in use, belongs to user!', 400));
    if (designationBelong)
        return next(new AppError('Department is in use, belongs to designation!', 400));

    req.department = department;
    next();
});

exports.createGrade = catchAsync(async (req, res, next) => {
    const categoryExist = await GradeCategory.exists({
        category: req.body.category,
    });
    if (!categoryExist) return next(new AppError('No such category exist!', 400));

    const { category } = req.body;

    const grades = await Grade.find({ category }).sort('-level');
    const level = grades.length > 0 ? grades[0].level + 1 : 1
    const grade = category.concat(level);

    const gradeExist = await Grade.exists({ grade });
    if (gradeExist) return next(new AppError('Duplicate grade!', 400));

    req.grade = {
        category,
        level,
        description: req.body.description,
        grade,
    };
    next();
});

exports.updateGrade = catchAsync(async (req, res, next) => {
    const grade = await Grade.findById(req.params.id);

    if (!grade) return next(new AppError('No grade found with given id!', 404));

    req.grade = grade;
    next();
});

exports.deleteGrade = catchAsync(async (req, res, next) => {
    const grade = await Grade.findOne({ grade: req.body.grade });
    if (!grade) return next(new AppError('Grade not found!', 404));

    if (!grade.active) return next(new AppError('Grade already deleted', 400));

    const [userBelong, designationBelong] = await Promise.all([
        User.exists({ grade: req.body.grade }),
        Designation.exists({ grade: req.body.grade }),
    ]);
    if (userBelong)
        return next(new AppError('Grade is in use, belongs to user!', 400));
    if (designationBelong)
        return next(new AppError('Grade is in use, belongs to designation!', 400));

    req.grade = grade;
    next();
});

exports.createDesignation = catchAsync(async (req, res, next) => {
    const [designationExists, departmentExists, gradeExists] = await Promise.all([
        Designation.exists({ name: req.body.name }),
        Department.exists({ name: req.body.department }),
        Grade.exists({ grade: req.body.grade }),
    ]);
    if (designationExists)
        return next(new AppError('Duplicate designation!', 400));

    if (!departmentExists)
        return next(new AppError('No such department exist!', 400));

    if (!gradeExists) return next(new AppError('No such grade exists!', 400));

    next();
});

exports.updateDesignation = catchAsync(async (req, res, next) => {
    const designation = await Designation.findById(req.params.id);
    if (!designation) return next(new AppError('Designation not found', 404));

    if (!designation.active)
        return next(new AppError('Can not update deleted designation!', 400));

    if (await Designation.exists({ name: req.body.name }))
        return next(new AppError('Duplicate designation name!', 400));

    if (await User.exists({ designation: designation.name }))
        return next(new AppError('Designation is in use!', 400));

    req.designation = designation;
    next();
});

exports.deleteDesignation = catchAsync(async (req, res, next) => {
    const designation = await Designation.findOne({ name: req.body.designation });
    if (!designation) return next(new AppError('Designation not found!', 404));

    if (!designation.active)
        return next(new AppError('Designation already deleted!', 400));

    if (await User.exists({ designation: designation.name }))
        return next(new AppError('Designation is in use!', 400));

    req.designation = designation;
    next();
});

exports.createLeaveRequest = catchAsync(async (req, res, next) => {
    if (!req.user.manager)
        return next(new AppError('Manager not assigned!', 400));

    if (!dayjs(req.body.startDate, 'YYYY-MM-DD', true).isValid() || !dayjs(req.body.endDate, 'YYYY-MM-DD', true).isValid())
        return next(new AppError('Please provide valid date in "YYYY-MM-DD" format!', 400));

    const startDate = dayjs(req.body.startDate);
    const endDate = dayjs(req.body.endDate);

    if (startDate < dayjs().startOf('D'))
        return next(new AppError('startDate must be greater than or equal to today\'s date!', 400));

    if (endDate < startDate)
        return next(new AppError('endDate must be greater than or equal to startDate!', 400));

    if (req.body.half && (req.body.startDate !== req.body.endDate))
        return next(new AppError('To take half day leave startDate must equal to endDate!', 400));

    const empLeave = await EmpLeave.findOne({ email: req.user.email });
    const leaveType = req.body.leaveType;

    if (empLeave.joiningDate > Date.now())
        return next(new AppError("Can't create leave request, you have not joined yet!", 400));

    if ((leaveType === 'PL' || leaveType === 'CL') && empLeave.probationEnd >= Date.now())
        return next(new AppError('Can not use PL and CL in probation period!', 400));

    const leaveDays = req.body.half ? 0.5 : (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

    if (empLeave[leaveType] < leaveDays)
        return next(new AppError(`You don't have that many ${leaveType} leaves!`, 400));

    req.leaveRequest = {
        empLeave,
        leaveType,
        leaveDays,
    };

    next();
});

exports.leaveRequestAction = catchAsync(async (req, res, next) => {
    const leaveRequest = await LeaveRequest.findById(req.params.leaveId);

    if (!leaveRequest)
        return next(new AppError('No such leave request exist with given id!', 404));

    if (leaveRequest.manager !== req.user.email)
        return next(new AppError('You can not take action on this leave request!', 401));

    const employee = await User.findOne({ email: leaveRequest.employee });
    if (employee.manager !== req.user.email)
        return next(new AppError('You are no longer manager of this employee', 401));

    if (!employee.active)
        return next(new AppError('Can not take action on deleted employee!', 400));

    // if (leaveRequest.action)
    //     return next(new AppError(`Can not take action, request is already ${leaveRequest.action}!`, 400));

    // const currentDate = new Date().set
    if (leaveRequest.isExpired)
        return next(new AppError('leaveRequest expired!', 400));

    req.leaveRequest = leaveRequest;

    next();
});

exports.getLeaveRequest = catchAsync(async (req, res, next) => {
    if (!req.params.user) {
        if (req.user.role === 'employee')
            return next(new AppError('You do not have access to this route!', 401));
    } else if (req.params.user === 'requester') {
        if (req.query.employee || req.query.manager)
            return next(new AppError('Invalid query object, only "action" field is allowed for this route!', 401));

        req.query.employee = req.user.email;

        if (!req.query.action)
            req.query.action = undefined;
    } else {
        if (req.query.employee || req.query.manager)
            return next(new AppError('Invalid query object, only "action" field is allowed for this route!', 401));

        req.query.manager = req.user.email;

        if (!req.query.action)
            req.query.action = undefined;
    }
    req.query.isExpired = false;

    next();
});

exports.deleteLeaveRequest = catchAsync(async (req, res, next) => {
    const leaveRequest = await LeaveRequest.findById(req.params.leaveId);
    if (!leaveRequest)
        return next(new AppError('No leave request found with given id!', 404));

    if (leaveRequest.employee !== req.user.email)
        return next(new AppError('Only user can delete his leave request!', 401));

    if (leaveRequest.action)
        return next(new AppError('Can not delete approved or rejected leave request!', 400));

    if (leaveRequest.isExpired)
        return next(new AppError('You can not delete expired leaveRequest!', 400));

    req.leaveRequest = leaveRequest;
    next();
});