const mongoose = require('mongoose');

const activeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'email is required field for activeSchema!']
    },
    token: {
        type: String,
        required: [true, 'jwt is required field for activeSchema!']
    },
    loginTime: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false
})

const Active = mongoose.model('Active', activeSchema);

module.exports = Active;