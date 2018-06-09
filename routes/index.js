const router = require('express').Router()
// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const dateFormat = require('dateformat');
const sass = require('node-sass-middleware')
const session = require('express-session')
const hat = require('hat')
const db = require('sqlite')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

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


/* Page d'accueil */
router.get('/', (req, res, next) => {
    let isconnected = false
    if (req && req.session && req.session.accessToken) {
        isconnected = true
    }
    res.format({
        html: () => { res.render('index', {
            title: 'notre super API !',
            isconnected: isconnected,
        }) },
        json: () => { res.send({ message: 'Bienvenue sur notre superbe API!' }) }
    })
})

module.exports = router
