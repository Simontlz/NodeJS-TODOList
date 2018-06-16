const router = require('express').Router()
// Dépendances native
const dateFormat = require('dateformat');

// Dépendances 3rd party
const express = require('express')
const db = require('sqlite')
const hat = require('hat')
const bcrypt = require('bcrypt')

// Constantes et initialisations
const app = express()

//==========================================================================================
//==========================================================================================
//==========================================================================================

router.get('/', (req, res, next) => {
    res.format({
        html: () => {
            res.render('sessions/login', {
                title: 'S\'identifier',
                user: {},
                action: '/sessions'
            })
        },
        json: () => {
            next(new Error('Bad request'))
        }
    })
})

router.post('/', (req, res, next) => {
    if(!req.body.pseudo || !req.body.password) {
        next(new Error('All fields must be given.'))
    }
    db.get("SELECT pseudo, password FROM users WHERE pseudo = ?", req.body.pseudo)
        .then((user) => {
            if (user) {
                bcrypt.compare(req.body.password, user.password).then((result) => {
                    if (result) {
                        let accessToken = hat();
                        let userId = user.pseudo;
                        let now = new Date();
                        Date.prototype.addHours= function(h){
                            this.setHours(this.getHours()+h);
                            return this;
                        };
                        let expiresAt = dateFormat((new Date()).setHours((new Date()).getHours() + 4));
                        req.session.accessToken = accessToken;
                        req.session.expiresAt = expiresAt;
                        req.session.userId = userId;
                        //INSERT DATA INTO TABLE SESSIONS IF NO RECORDS WITH THE SAME PSEUDO
                        db.get('SELECT * FROM sessions WHERE userId = ?', userId).then((result) => {
                            if (result){
                                db.run('UPDATE sessions SET expiresAt = ? WHERE userId = ?', expiresAt, userId).then(() => {
                                    res.format({
                                        html: () => { res.redirect('/users') },
                                        json: () => {
                                            res.send({
                                                ACCESSTOKEN: accessToken
                                            })
                                        },
                                    })
                                })
                            } else {
                                db.run('INSERT INTO sessions SELECT "'+user.pseudo+'", "'+accessToken+'", "'+dateFormat(now)+'", "'+expiresAt+'" WHERE NOT EXISTS(SELECT 1 FROM sessions WHERE userId = "'+user.pseudo+'")')
                                    .then(() => {
                                        res.format({
                                            html: () => { res.redirect('/users') },
                                            json: () => {
                                                res.send({
                                                    ACCESSTOKEN: accessToken
                                                })
                                            },
                                        })
                                    }).catch(next)
                            }
                        });
                    }
                }).catch(next);
            }
            else {
                res.format({
                    html: () => { res.redirect('/sessions') },
                    json: () => {
                        res.send({
                            message: 'Wrong username/password'
                        })
                    },
                })
            }
        }).catch(next);

});

router.delete('/:userId', (req, res, next) => {
    db.run('DELETE FROM sessions WHERE userId = ?', req.params.userId)
        .then(() => {
            res.format({
                html: () => { res.redirect('/sessions') },
                json: () => { res.status(201).send({message: 'success'}) }
            })
        }).catch(next)
})

router.get('/logout', (req, res, next) => {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
})

module.exports = router

