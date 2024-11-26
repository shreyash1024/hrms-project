const dayjs = require("dayjs");

const LeaveRequest = require("../models/leaveRequestModel");
const EmpLeave = require("../models/empLeaveModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const ApiFeatures = require("../utils/apiFeatures");
const {addLeavesBack} = require("../services/leaveRequestService");

exports.createLeaveRequest = catchAsync(async (req, res, next) => {
  const {empLeave, leaveType, leaveDays} = req.leaveRequest;

  empLeave[leaveType] -= leaveDays;
  await empLeave.save();

  req.body.employee = req.user.email;
  req.body.manager = req.user.manager;
  req.body.leaveDays = leaveDays;

  const leaveRequest = await LeaveRequest.create(req.body);

  res.status(200).json({
    status: "success",
    data: {
      leaveRequest,
    },
  });
});

exports.leaveRequests = async (req, res, next) => {
  req.filter = {manager: req.user.email, action: {$exists: false}, isExpired: false};
  next();
};

exports.approvedLeaveRequestsManager = (req, res, next) => {
  req.filter = {manager: req.user.email, action: "approved"};
  next();
};

exports.rejectedLeaveRequestsManager = (req, res, next) => {
  req.filter = {manager: req.user.email, action: "rejected"};
  next();
};

exports.myLeaveRequests = async (req, res, next) => {
  req.filter = {employee: req.user.email, action: {$exists: false}, isExpired: false};
  next();
};

exports.approvedLeaveRequestsUser = (req, res, next) => {
  req.filter = {employee: req.user.email, action: "approved"};
  next();
};

exports.rejectedLeaveRequestsUser = (req, res, next) => {
  req.filter = {employee: req.user.email, action: "rejected"};
  next();
};

exports.getLeaveRequest = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(LeaveRequest.find(), req.query).filter().sort().limitFields().paginate();

  const leaveRequests = await features.query;

  res.status(200).json({
    status: "success",
    results: leaveRequests.length,
    data: {
      leaveRequests,
    },
  });
});

exports.leaveRequestAction = catchAsync(async (req, res, next) => {
  const {leaveRequest} = req;
  if (req.body.action === "approve") {
    if (leaveRequest.action === "approved") return next(new AppError("Leave Request already approved!", 400));
    if (leaveRequest.action === "rejected") {
      const leaveDays = leaveRequest.half
        ? 0.5
        : (leaveRequest.endDate - leaveRequest.startDate) / (1000 * 60 * 60 * 24) + 1;
      const empLeave = await EmpLeave.findOne({email: leaveRequest.employee});
      empLeave[leaveRequest.leaveType] -= leaveDays;
      await empLeave.save();
    }
    leaveRequest.action = "approved";
    leaveRequest.actionAt = dayjs();
  } else if (req.body.action === "reject") {
    if (leaveRequest.action === "rejected") return next(new AppError("Leave Request already rejected!", 400));
    leaveRequest.action = "rejected";
    leaveRequest.actionAt = dayjs();

    await addLeavesBack(leaveRequest);
  }

  await leaveRequest.save();

  res.status(200).json({
    status: "success",
    message: `leave ${leaveRequest.action}!`,
    leaveRequest,
  });
});

exports.myLeaves = catchAsync(async (req, res, next) => {
  const empLeave = await EmpLeave.findOne({email: req.user.email});

  res.status(200).json({
    status: "success",
    data: {
      myLeaves: empLeave,
    },
  });
});

exports.deleteLeaveRequest = catchAsync(async (req, res, next) => {
  await addLeavesBack(req.leaveRequest);

  const deleted = await LeaveRequest.findByIdAndDelete(req.leaveRequest.id);

  res.status(204).json({
    status: "success",
    message: "leave request deleted!",
    "leave request": deleted,
  });
});
