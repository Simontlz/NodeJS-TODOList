const router = require('express').Router()
// Dépendances native

// Dépendances 3rd party
const express = require('express')
const db = require('sqlite')


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
