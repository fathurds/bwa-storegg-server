const mongoose = require('mongoose');
let transactionSchema = mongoose.Schema({
    historyVoucherTopup: {
        gameName: {
            type: String,
            required: [true, 'Nama game harus diisi']
        },
        category: {
            type: String,
            required: [true, 'Kategori harus diisi']
        },
        thumbnail: {
            type: String,
        },
        coinName: {
            type: String,
            require: [true, 'Nama koin harus diisi']
        },
        coinQuantity: {
            type: String,
            require: [true, 'Jumlah koin harus diisi']
        },
        price: {
            type: Number
        },
    },
    historyPayment: {
        name: {
            type: String,
            required: [true, 'Nama harus diisi']
        },
        type: {
            type: String,
            required: [true, 'Tipe pembayaran harus diisi']
        },
        bankName: {
            type: String,
            required: [true, 'Nama bank harus diisi']
        },
        noRekening: {
            type: String,
            required: [true, 'No rekening harus diisi']
        },
    },
    name: {
        type: String,
        required: [true, 'Nama harus diisi'],
        maxLength: [225, "panjang nama harus antara 3-225 karakter"],
        minLength: [3, "panjang nama harus antara 3-225 karakter"]
    },
    accountUser: {
        type: String,
        required: [true, 'Nama akun harus diisi'],
        maxLength: [225, "panjang nama harus antara 3-225 karakter"],
        minLength: [3, "panjang nama harus antara 3-225 karakter"]
    },
    tax: {
        type: Number,
        default: 0
    },
    value: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    },
    historyUser: {
        name: {
            type: String,
            required: [true, 'Nama player harus diisi']
        },
        phoneNumber: {
            type: String,
            required: [true, 'Nomor Telepon harus diisi'],
            maxLength: [14, "panjang nama harus antara 9-13 karakter"],
            minLength: [8, "panjang nama harus antara 9-13 karakter"]
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

module.exports = mongoose.model('Transaction', transactionSchema);