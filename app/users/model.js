const mongoose = require('mongoose');
let userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'E-mail harus diisi']
    },
    name: {
        type: String,
        required: [true, 'Nama harus diisi']
    },
    password: {
        type: String,
        required: [true, 'Password harus diisi']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['Y', 'N'],
        default: 'Y'
    },
    phoneNumber: {
        type: String,
        require: [true, 'Nomo telepon harus diisi']
    }

}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);