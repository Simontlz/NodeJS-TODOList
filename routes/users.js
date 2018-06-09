const router = require('express').Router()
// Dépendances native
const path = require('path')
const App = require('../app');
const dateFormat = require('dateformat');

// Dépendances 3rd party
const express = require('express')
const session = require('express-session')
const sass = require('node-sass-middleware')
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

/* Users : liste */
router.get('/', function(req, res, next) {
    const wheres = []

    if (req.query.firstname) {
        wheres.push(`firstname LIKE '%${req.query.firstname}%'`)
    }

    if (req.query.lastname) {
        wheres.push(`lastname LIKE '%${req.query.lastname}%'`)
    }

    const limit = `LIMIT ${req.query.limit || 100}`
    const offset = `OFFSET ${ req.query.offset || 0}`
    const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : ''
    let order = ''
    let reverse = ''
    if (req.query.order && req.query.reverse) {
        order = `ORDER BY ${req.query.order}`
        if (req.query.reverse == '1') {
            reverse = 'DESC'
        } else if (req.query.reverse == '0') {
            reverse = 'ASC'
        }
    }

    query = `SELECT * FROM users ${where} ${order} ${reverse} ${limit} ${offset}`

    db.all(query)
        .then((users) => {
            res.format({
                html: () => { res.render('users/index', {
                    users: users,
                    isconnected : true,
                }) },
                json: () => { res.send(users) }
            })
        }).catch(next)
})

// VIEW: ADD USER
router.get('/add', (req, res, next) => {
    res.format({
        html: () => {
            res.render('users/edit', {
                title: 'Ajouter un utilisateur',
                user: {},
                isconnected : true,
                action: '/users'
            })
        },
        json: () => {
            next(new Error('Bad request'))
        }
    })
})

router.get('/:userId', function(req, res, next) {
    db.get('SELECT * FROM users WHERE ROWID = ?', req.params.userId)
        .then((user) => {
            res.format({
                html: () => { res.render('users/show', {
                    user: user,
                    isconnected : true,
                }) },
                json: () => { res.status(201).send({message: 'success'}) }
            })
        }).catch(next)
})

// VIEW: EDIT USER
router.get('/:userId/edit', (req, res, next) => {
    res.format({
        html: () => {
            db.get('SELECT * FROM users WHERE ROWID = ?', req.params.userId)
                .then((user) => {
                    if (!user) next()
                    res.render('users/edit', {
                        title: 'Editer un utilisateur',
                        isconnected : true,
                        user: user,
                        action: '/users/' + req.params.userId + '?_method=put',
                    })
                })
        },
        json: () => {
            next(new Error('Bad request'))
        }
    })
})

// POST USER
router.post('/', (req, res, next) => {
    if(!req.body.pseudo || !req.body.email || !req.body.firstname || !req.body.lastname || !req.body.password) {
        next(new Error('All fields must be given.'))
    }
    let now = new Date()
    bcrypt.hash(req.body.password, saltRounds).then(function(passwordHashed) {
        db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", req.body.pseudo, req.body.email, req.body.firstname, req.body.lastname, passwordHashed, dateFormat(now), null)
            .then(() => {
                res.format({
                    html: () => { res.redirect('/users') },
                    json: () => { res.status(201).send({message: 'success'}) }
                })
            }).catch(next)
    }).catch(next);
});

// DELETE USER
router.delete('/:userId', (req, res, next) => {
    db.run('DELETE FROM users WHERE ROWID = ?', req.params.userId)
        .then(() => {
            res.format({
                html: () => { res.redirect('/users') },
                json: () => { res.status(201).send({message: 'success'}) }
            })
        }).catch(next)
})

// UPDATE USER
router.put('/:userId', (req, res, next) => {
    db.run("UPDATE users SET pseudo = ?, email = ?, firstname = ?, lastname = ?, updatedAt= ? WHERE rowid = ?",req.body.pseudo, req.body.email, req.body.firstname, req.body.lastname, new Date(), req.params.userId)
        .then(() => {
            res.format({
                html: () => { res.redirect('/users') },
                json: () => { res.status(201).send({message: 'success'}) }
            })
        }).catch(next)
})

module.exports = router
