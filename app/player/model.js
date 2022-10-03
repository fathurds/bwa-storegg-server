const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const HASH_ROUND = 10;

let playerSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'E-mail harus diisi']
    },
    name: {
        type: String,
        required: [true, 'Nama harus diisi'],
        maxLength: [225, "panjang nama harus antara 3-225 karakter"],
        minLength: [3, "panjang nama harus antara 3-225 karakter"]
    },
    username: {
        type: String,
        required: [true, 'Username harus diisi'],
        maxLength: [12, "panjang username harus antara 6-12 karakter"],
        minLength: [6, "panjang username harus antara 6-12 karakter"]
    },
    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        maxLength: [225, "panjang password maksimal 225 karakter"],
        minLength: [6, "panjang password minimal 6 karakter"]
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
    avatar: {
        type: String,
    },
    fileName: {
        type: String
    },
    phoneNumber: {
        type: String,
        require: [true, 'Nomo telepon harus diisi'],
        maxLength: [14, "Nomor telepon berisi 8-14 karakter"],
        minLength: [8, "Nomor telepon berisi 8-14 karakter"]
    },

    favorite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },

}, { timestamps: true })

// Validasi email sudah terdaftar
playerSchema.path('email').validate(async function (value) {
    try {
        const count = await this.model('Player').countDocuments({ email: value })
        return !count;
    } catch (err) {
        throw err
    }
}, attr => `${attr.value} sudah terdaftar`)

// Hash password
playerSchema.pre('save', function (next) {
    this.password = bcrypt.hashSync(this.password, HASH_ROUND);
    next();
})

module.exports = mongoose.model('Player', playerSchema);