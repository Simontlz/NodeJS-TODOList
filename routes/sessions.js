const router = require('express').Router()
// Dépendances native
const path = require('path')
const dateFormat = require('dateformat');

// Dépendances 3rd party
const express = require('express')
const sass = require('node-sass-middleware')
const session = require('express-session')
const db = require('sqlite')
const bodyParser = require('body-parser')
const hat = require('hat')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

// DATABASE
db.open('expressapi.db').then(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (pseudo, email, firstname, lastname, password, createdAt, updatedAt)')
        .then(() => {
        }).catch((err) => { // Si on a eu des erreurs
        console.error('ERR> ', err)
    })
    db.run('CREATE TABLE IF NOT EXISTS sessions (userId, accessToken, createdAt, expiresAt)')
        .then(() => {
        }).catch((err) => { // Si on a eu des erreurs
        console.error('ERR> ', err)
    })
    db.run('CREATE TABLE IF NOT EXISTS todos (userId, message, createdAt, updatedAt, completedAt)')
        .then(() => {
        }).catch((err) => { // Si on a eu des erreurs
        console.error('ERR> ', err)
    })
})

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
            bcrypt.compare(req.body.password, user.password).then((result) => {
                if (result) {
                    let accessToken = hat();
                    let userId = user.pseudo;
                    let now = new Date();
                    //INSERT DATA INTO TABLE SESSIONS IF NO RECORDS WITH THE SAME PSEUDO
                    db.run('INSERT INTO sessions SELECT "'+user.pseudo+'", "'+accessToken+'", "'+dateFormat(now)+'", "'+null+'" WHERE NOT EXISTS(SELECT 1 FROM sessions WHERE userId = "'+user.pseudo+'")')
                        .then(() => {
                            req.session.accessToken = accessToken;
                            req.session.userId = userId;
                            res.format({
                                html: () => { res.redirect('/users') },
                                json: () => { res.send('Access token: '+accessToken) },
                            })
                        }).catch(next)
                }
            }).catch(next);
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

