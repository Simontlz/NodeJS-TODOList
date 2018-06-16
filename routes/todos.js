const router = require('express').Router()
// Dépendances native
const dateFormat = require('dateformat');

// Dépendances 3rd party
const db = require('sqlite')


//==========================================================================================
//==========================================================================================
//==========================================================================================

/* Users : liste */
router.get('/', function(req, res, next) {

    db.all("SELECT ROWID as rowId, userId, message, createdAt, completedAt FROM todos WHERE userId LIKE '"+req.session.userId+"' ORDER BY CASE WHEN completedAt is null then 1 else 2 end, createdAt DESC")
        .then((todos) => {
            res.format({
                html: () => { res.render('todos/index', {
                    todos: todos,
                    isconnected : true,
                }) },
                json: () => { res.send(todos) }
            })
        }).catch(next)
})

// VIEW: ADD TODOS
router.get('/add', (req, res, next) => {
    res.format({
        html: () => {
            res.render('todos/edit', {
                title: 'Ajouter un todo',
                user: {},
                isconnected : true,
            })
        },
        json: () => {
            next(new Error('Bad request'))
        }
    })
})

// POST TODOS
router.post('/', (req, res, next) => {
    if(!req.body.message) {
        next(new Error('All fields must be given.'))
    }
    let now = new Date();
    db.run("INSERT INTO todos VALUES (?, ?, ?, ?, ?)", req.session.userId, req.body.message, dateFormat(now), null, null)
        .then(() => {
            res.format({
                html: () => { res.redirect('/todos') },
                json: () => { res.status(201).send({message: 'success'}) }
            })
        }).catch(next)
});

// UPDATE TODOS
router.post('/update', (req, res, next) => {
    let now = new Date();
    id = req.body.id;
    if (typeof(id) != 'undefined') {
        if (id.length < 2) {
            db.run("UPDATE todos SET completedAt = ? WHERE ROWID = ?", dateFormat(now), id)
        }
        else {
            id.forEach(function(idToUpdate) {
                db.run("UPDATE todos SET completedAt = ? WHERE ROWID = ?", dateFormat(now), idToUpdate)
            })
        }
    }
    else {
        db.run("UPDATE todos SET completedAt = ?", null)
    }
    res.format({
        html: () => { res.redirect('/todos') },
        json: () => { res.status(201).send({message: 'success'}) }
    })
});

// DELETE TODOS
router.get('/delete/:id', (req, res, next) => {
    todoId = req.params.id;
    db.run("DELETE FROM todos WHERE ROWID = ?", todoId)
    res.format({
        html: () => { res.redirect('/todos') },
        json: () => { res.status(201).send({message: 'success'}) }
    })
});

module.exports = router
