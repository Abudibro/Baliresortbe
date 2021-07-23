const express = require('express');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');

const app = express();

app.use(express.json());
app.use(cors());

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'abdurahmanhijazi',
        password : '',
        database : 'baliresorts'
    }
});

let adminSignedIn = false;

app.get('/', (req, res) => {
    db.select('*').from('resorts').where('featured', '=', true)
    .then(featured => {
        res.send(featured);
    })
    .catch(e => {
        res.send("Error getting featured", e);
    })
})

app.get('/resorts', (req, res) => {
    db.select('*').from('resorts')
    .then(featured => {
        res.send(featured);
    })
    .catch(e => {
        res.send("Error getting featured", e);
    })
})

app.post('/admin', (req, res) => {
    const {username, password } = req.body;

    db.select('username', 'hash').from('login').where('username', '=', username)
    .then(data => {
        bcrypt.compare(password, data[0].hash, (err, result) => {
            if (result) {
                res.json('sign-in');
                adminSignedIn = true;
            } else {
                res.json('Incorrect username or password');
            }
        })
    })
})

app.get('/dashboard', (req, res) => {
    if (!adminSignedIn) {
        res.json("not logged in");
        return;
    }

    db.select('*').from('resorts')
    .then(featured => {
        res.send(featured);
    })
})

app.get('/signout', (req, res) => {
    adminSignedIn = false;
});

app.delete('/dashboard/delete/:id', (req, res) => {
    if (!adminSignedIn) {
        res.json("not logged in");
        return;
    }

    const { id } = req.params;

    db('resorts')
    .where('id', id)
    .del()
    .then(res.json("deleted"))
    // .catch(res.json("Failed to delete"))
});

app.put('/dashboard/edit/:id', (req, res) => {
    if (!adminSignedIn) {
        res.json("not logged in");
        return;
    }

    const { id, title, price, fulldesc, minidesc, smoking, guests, featured } = req.body.resort;

    db('resorts')
    .where('id', '=', id)
    .update({
        title: title,
        price: price,
        fulldesc: fulldesc,
        minidesc: minidesc,
        smoking: smoking,
        guests: guests,
        featured: featured
    })
    .then(res.json("updated"))
    // .catch(res.status(400).send())
})

app.post('/dashboard/add', (req, res) => {
    if (!adminSignedIn) {
        res.json("not logged in");
        return;
    }
    
    const { title, price, fulldesc, minidesc, img, smoking, guests, featured } = req.body.resort;

    db.transaction(((trx) => {
        db('resorts').transacting(trx).insert({
            title: title,
            price: price,
            fulldesc: fulldesc,
            minidesc: minidesc,
            img: img,
            smoking: smoking,
            guests: guests,
            featured: featured
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }))
    .then(function(resp) {
        res.json("added");
    })
    .catch(function(err) {
        res.json("Error")
    });
});

app.listen(8000, () => {
    console.log("App is listenng on port 8000")
});