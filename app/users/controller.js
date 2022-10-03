const User = require('./model');
const bcrypt = require('bcryptjs');

module.exports = {
    viewSignIn: async (req, res) => {
        try {
            const alertMessage = req.flash("alertMessage");
            const alertStatus = req.flash("alertStatus");

            const alert = { message: alertMessage, status: alertStatus };

            if (!req.session.user) {
                res.render('admin/users/view_signin', {
                    alert,
                    title: 'Halaman Signin'
                });
            } else {
                res.redirect('/dashboard');
            }

        } catch (err) {
            req.flash('alertMessage', `${err.message}`);
            req.flash('alertStatus', 'danger');
            res.redirect('/')
        }
    },
    actionSignin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: email });

            if (user) {
                if (user.status === 'Y') {
                    const checkPassword = await bcrypt.compare(password, user.password);
                    if (checkPassword) {
                        req.session.user = {
                            id: user._id,
                            email: user.email,
                            status: user.status,
                            name: user.name
                        }
                        res.redirect('/dashboard');
                    } else {
                        req.flash('alertMessage', 'Kata sandi yang dimasukan salah');
                        req.flash('alertStatus', 'danger');
                        res.redirect('/')
                    }

                } else {
                    req.flash('alertMessage', 'Mohon maaf status anda belum aktif');
                    req.flash('alertStatus', 'danger');
                    res.redirect('/')
                }
            } else {
                req.flash('alertMessage', 'Email yang anda inputkan salah');
                req.flash('alertStatus', 'danger');
                res.redirect('/')
            }
        } catch (err) {
            req.flash('alertMessage', `${err.message}`);
            req.flash('alertStatus', 'danger');
            res.redirect('/')
        }
    },
    actionLogout: (req, res) => {
        req.session.destroy();
        res.redirect('/');
    }
}
