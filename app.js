// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const sass = require('node-sass-middleware')
const session = require('express-session')
const db = require('sqlite')
const dateFormat = require('dateformat');
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const hat = require('hat')


// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

// DATABASE
db.open('expressapi.db').then(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (pseudo, email, firstname, lastname, password, createdAt, updatedAt)')
        .then(() => {
            console.log('> Database ready')
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

// Middleware de sessions
app.set('trust proxy', 1)
app.use(session({
    secret: 'topkek',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true
    }
}))


// Override POST
app.use(methodOverride('_method'))
// LOGGER
app.use((req, res, next) => {
    next()
    console.log('REQUEST: ' + req.method + ' ' + req.url)
})


// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

function requiresAuthentication (req, res, next) {
    if (req && req.session && req.session.accessToken) {
        next()
    }
    else if (req.originalUrl == "/users/add"){
        next()
    }
    else if (req.originalUrl == "/users" && req.method == "POST"){
        next()
    }
    else {
        res.redirect('/sessions')
    }
}

// La liste des différents routeurs (dans l'ordre)

app.use('/', require('./routes/index'))
app.use('/users', requiresAuthentication, require('./routes/users'))
app.use('/todos', requiresAuthentication, require('./routes/todos'))
app.use('/sessions', require('./routes/sessions'))

// Erreur 404
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})


// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})

app.listen(PORT, () => {
  console.log('Serveur démarré sur le port : ', PORT)
})