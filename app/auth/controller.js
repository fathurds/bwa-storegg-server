const Player = require('../player/model');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
    signup: async (req, res, next) => {
        try {
            const payload = req.body; // semua req body

            if (req.file) { // jika ada file
                let tmp_path = req.file.path;
                let originaExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
                let filename = req.file.filename + '.' + originaExt;
                let target_path = path.resolve(config.rootPath, `public/uploads/${filename}`);

                const src = fs.createReadStream(tmp_path);
                const dest = fs.createWriteStream(target_path);

                src.pipe(dest);

                src.on('end', async () => {
                    try {
                        const player = new Player({ ...payload, avatar: filename })
                        await player.save();

                        delete player._doc.password;

                        res.status(201).json({ data: player })

                    } catch (err) {
                        if (err && err.name === "ValidationError") {
                            return res.status(422).json({
                                error: 1,
                                message: err.message,
                            })
                        }
                        next(err);
                    }
                })
            } else { // jika tidak ada file
                let player = new Player(payload);
                await player.save();

                delete player._doc.password;

                res.status(201).json({ data: player })
            }

        } catch (err) { // jika password tidak 8-225 karakter
            if (err && err.name === "ValidationError") {
                return res.status(422).json({
                    error: 1,
                    message: err.message,
                })
            }
            next(err);
        }
    },
    signin: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const player = await Player.findOne({email: email});

            if (player) {
                const checkPassword = bcrypt.compareSync(password, player.password);
                if (checkPassword) {
                    const token = jwt.sign({
                        player: {
                            id: player.id,
                            username: player.username,
                            email: player.email,
                            nama: player.nama,
                            phoneNumber: player.phoneNumber,
                            avatar: player.avatar,
                        }
                    }, config.jwtKey);

                    res.status(200).json({ data: { token } });
                } else {
                    res.status(403).json({
                        message: 'Password yang anda masukan salah'
                    })
                }
            } else {
                res.status(403).json({
                    message: 'Email yang anda masukan belum terdaftar'
                })
            }
        } catch (err) {
            res.status(500).json({ message: err.message || 'Internal server error' })
        }
        
        next();

        // Player.findOne({ email: email }).then((player) => {
        //     if (player) {
        //         const checkPassword = bcrypt.compareSync(password, player.password);
        //         if (checkPassword) {
        //             const token = jwt.sign({
        //                 player: {
        //                     id: player.id,
        //                     username: player.username,
        //                     email: player.email,
        //                     nama: player.nama,
        //                     phoneNumber: player.phoneNumber,
        //                     avatar: player.avatar,
        //                 }
        //             }, config.jwtKey);

        //             res.status(200).json({ data: { token } })
        //         } else {
        //             res.status(403).json({
        //                 message: 'Password yang anda masukan salah'
        //             })
        //         }
        //     } else {
        //         res.status(403).json({
        //             message: 'Email yang anda masukan belum terdaftar'
        //         })
        //     }
        // }).catch((err) => {
        //     res.status(500).json({ message: err.message || 'Internal server error' })
        // })

        // next();
    }
}