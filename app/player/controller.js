const Player = require('./model');
const Voucher = require('../voucher/model');
const Category = require('../category/model');
const Nominal = require('../nominal/model');
const Payment = require('../payment/model');
const Bank = require('../bank/model');
const Transaction = require('../transaction/model');

const path = require('path');
const fs = require('fs');
const config = require('../../config');

module.exports = {
    landingPage: async (req, res) => {
        try {
            const voucher = await Voucher.find()
                .select('_id name voucher status category thumbnail')
                .populate('category');

            res.status(200).json({ data: voucher });

        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },
    detailPage: async (req, res) => {
        try {
            const { id } = req.params;
            const voucher = await Voucher.findOne({ _id: id })
                .populate('category')
                .populate('nominals')
                .populate('user', '_id name phoneNumber');

            const payment = await Payment.find().populate('banks');

            if (!voucher) {
                return res.status(404).json({ message: "Voucher not found" });
            }

            res.status(200).json({
                data: {
                    detail: voucher,
                    payment
                }
            });

        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },
    category: async (req, res) => {
        try {
            const category = await Category.find();
            res.status(200).json({ data: category });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },
    checkout: async (req, res) => {
        try {
            const { accountUser, name, nominal, voucher, payment, bank } = req.body;

            const resVoucher = await Voucher.findOne({ _id: voucher })
                .select('name category _id thumbnail user')
                .populate('category')
                .populate('user');

            if (!resVoucher) return res.status(404).json({ message: 'Voucher game tidak ditemukan' });

            const resNominal = await Nominal.findOne({ _id: nominal })

            if (!resNominal) return res.status(404).json({ message: 'Nominal voucher tidak ditemukan' });

            const resPayment = await Payment.findOne({ _id: payment })

            if (!resPayment) return res.status(404).json({ message: 'Payment tidak ditemukan' });

            const resBank = await Bank.findOne({ _id: bank })

            if (!resBank) return res.status(404).json({ message: 'Bank tidak ditemukan' });

            let tax = (10 / 100) * resNominal._doc.price;
            let value = resNominal._doc.price + tax;

            const payload = {
                historyVoucherTopup: {
                    gameName: resVoucher._doc.name,
                    category: resVoucher._doc.category ? resVoucher._doc.category.name : '',
                    thumbnail: resVoucher._doc.thumbnail,
                    coinName: resNominal._doc.coinName,
                    coinQuantity: resNominal._doc.coinQuantity,
                    price: resNominal._doc.price
                },
                historyPayment: {
                    name: resBank._doc.name,
                    type: resPayment._doc.type,
                    bankName: resBank._doc.bankName,
                    noRekening: resBank._doc.noRekening,
                },
                name,
                accountUser,
                tax,
                value,
                player: req.player._id,
                historyUser: {
                    name: resVoucher._doc.user?.name,
                    phoneNumber: resVoucher._doc.user?.phoneNumber
                },
                category: resVoucher._doc.category?._id,
                user: resVoucher._doc.user?._id
            }

            const transaction = new Transaction(payload);
            await transaction.save();

            res.status(201).json({ data: transaction });

        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },

    history: async (req, res) => {
        try {
            const { status = '' } = req.query;

            let criteria = {};

            if (status.length) {
                criteria = {
                    ...criteria,
                    status: { $regex: `${status}`, $options: 'i' }
                }
            }

            if (req.player._id) {
                criteria = {
                    ...criteria,
                    player: req.player._id
                }
            }

            const history = await Transaction.find(criteria);

            let total = await Transaction.aggregate([
                { $match: criteria },
                {
                    $group: {
                        _id: null,
                        value: { $sum: '$value' }
                    }
                }
            ])

            res.status(200).json({
                data: history,
                total: total.length ? total[0].value : 0,
            })

        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },

    detailHistory: async (req, res) => {
        try {
            const { id } = req.params;

            const history = await Transaction.findOne({ _id: id });

            if (!history) {
                return res.status(404).json({ message: 'History tidak ditemukan' });
            }

            res.status(200).json({ data: history });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },

    dashboard: async (req, res) => {
        try {
            const count = await Transaction.aggregate([
                { $match: { player: req.player._id } },
                {
                    $group: {
                        _id: '$category',
                        value: { $sum: '$value' }
                    }
                }
            ])

            const category = await Category.find();

            category.forEach(el => {
                count.forEach(data => {
                    if (data._id.toString() === el._id.toString()) {
                        data.name = el.name;
                    }
                })
            });

            const history = await Transaction.find({ player: req.player._id })
                .populate('category')
                .sort({ 'updateAt': -1 })

            res.status(200).json({ data: history, count: count });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },

    profile: async (req, res) => {
        try {

            const player = {
                id: req.player._id,
                username: req.player.username,
                email: req.player.email,
                name: req.player.name,
                avatar: req.player.avatar,
                phoneNumber: req.player.phoneNumber,
            }

            res.status(200).json({ data: player })

        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    },

    editProfile: async (req, res, next) => {
        try {
            const { name = "", phoneNumber = "" } = req.body;

            const payload = {};

            if (name.length) {
                payload.name = name
            }

            if (phoneNumber.length) {
                payload.phoneNumber = phoneNumber
            }

            if (req.file) {

                let tmp_path = req.file.path;
                let originaExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
                let filename = req.file.filename + '.' + originaExt;
                let target_path = path.resolve(config.rootPath, `public/uploads/${filename}`);

                const src = fs.createReadStream(tmp_path);
                const dest = fs.createWriteStream(target_path);

                src.pipe(dest);

                src.on('end', async () => {
                    let player = await Player.findOne({ _id: req.player._id });

                    let currentImage = `${config.rootPath}/public/uploads/${player.avatar}`;
                    if (fs.existsSync(currentImage)) {
                        fs.unlinkSync(currentImage)
                    }

                    player = await Player.findOneAndUpdate({
                        _id: req.player._id
                    }, {
                        ...payload,
                        avatar: filename
                    }, { new: true, runValidators: true })

                    res.status(201).json({
                        data: {
                            id: player.id,
                            name: player.name,
                            phoneNumber: player.phoneNumber,
                            avatar: player.avatar,
                        }
                    })
                })

                src.on('err', async () => {
                    next(err);
                })

            } else {
                const player = await Player.findOneAndUpdate({
                    _id: req.player._id
                }, payload, { new: true, runValidators: true })

                res.status(201).json({
                    data: {
                        id: player.id,
                        name: player.name,
                        phoneNumber: player.phoneNumber,
                        avatar: player.avatar,
                    }
                })
            }


        } catch (err) {
            if (err && err.name === "VaLidationError") {
                res.status(422).json({
                    error: 1,
                    message: err.message,
                    fields: err.errors
                })
            }
        }
    }
}