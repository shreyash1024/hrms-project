const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    photo: String,
    phone: { type: String, unique: true },
    dob: { type: String },
    role: { type: String, enum: ['admin', 'HR', 'employee'] },
    department: { type: String },
    grade: { type: String },
    designation: { type: String },
    manager: { type: String },
    salary: { type: Number },
    joiningDate: { type: Date },
    address: { type: String },
    password: { type: String, select: false },
    passwordConfirm: { type: String, select: false },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: String, select: false },
    gradeUpdateRecent: { type: Date, select: false },
}, {
    versionKey: false
})

// checks if the password is correct or not
userSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;