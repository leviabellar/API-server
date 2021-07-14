const express = require('express');
const cors = require('cors');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

app.use(express.json());
app.use(cors());

MongoClient.connect('mongodb+srv://user001:user001-mongodb-basics@practice.54zqw.mongodb.net/test?retryWrites=true&w=majority', {useUnifiedTopology: true}, (err, client) => {
    if (err) throw err;
    console.log('Database Connected');
    const dbProduct = client.db('product');
    const beansCollection = dbProduct.collection('beans');
    const dbTask003 = client.db('task003');
    const contactsCollection = dbTask003.collection('contacts');
    
    app.post('/beans', (req, res) => {
        if (!req.body.name) return res.status(400).send('Must have name');
        if (!Number.isInteger(req.body.qty)) return res.status(400).send('Quantity must be an Integer');

        const bean = {
            name: req.body.name,
            qty: req.body.qty
        };
        beansCollection.insertOne(bean);
        res.send(bean);
    });

    app.get('/beans', (req, res) => {
        dbProduct.collection('beans').find({}).toArray((err, result) => {
            if (err) throw err;
            res.send(result);
        });
    });

    app.get('/contacts', (req, res) => {
        contactsCollection.find({}).sort({first_name: 1}).toArray((err, result) => {
            if (err) throw err;
            res.send(result);
        });
    });

    app.get('/:id', (req, res) => {
        contactsCollection.find({_id: ObjectId(req.params['id'])}).toArray((err, result) => {
            if (err) throw err;
            res.send(result[0]);
        });
    });

    app.post('/contacts', (req, res) => {
        const contact = {
            last_name: req.body.last_name,
            first_name: req.body.first_name,
            phone_numbers: req.body.phone_numbers
        };
        contactsCollection.insertOne(contact);
        res.send(contact);
    });

    app.get('/contacts/total', (req, res) => {
        contactsCollection.countDocuments({}, (err, result) => {
            if(err) res.send(err);
            else res.json(result);
        })
    });

    app.delete('/contacts/delete/:_id', (req, res) => {
        contactsCollection.deleteOne({_id: new ObjectId(req.params['_id'])}, (err) => {
            if (err) throw err;
            res.send('1 document deleted');
        })
    });

    app.put('/contacts/:_id', (req, res) => {
        const contact = {
            last_name: req.body.last_name,
            first_name: req.body.first_name,
            phone_numbers: req.body.phone_numbers
        };
        contactsCollection.updateOne({_id: new ObjectId(req.params['_id'])}, {$set: contact}, (err) => {
            if(err) throw err;
            res.send('Update Successful');
        })
    });

    app.put('/contacts/last_name/:last_name', (req, res) => {
        contactsCollection.updateOne({last_name: req.params['last_name']}, {$set: {last_name: req.body.last_name}}, (err) => {
            if(err) throw err; 
            res.send('Succesful')
        });
    });

    app.put('/contacts/first_name/:first_name', (req, res) => {
        contactsCollection.updateOne({first_name: req.params['first_name']}, {$set: {first_name: req.body.first_name}}, (err) => {
            if(err) throw err; 
            res.send('Succesful')
        });
    });

    app.put('/contacts/phone_numbers/:phone_numbers', (req, res) => {
        contactsCollection.updateOne({phone_numbers: req.params['last_name']}, {$set: {last_name: req.body.last_name}}, (err) => {
            if(err) throw err; 
            res.send('Succesful')
        });
    });
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/smile', (req, res) => {
    res.send(':D');
});

app.get('/sad', (req, res) => {
    res.send(':(');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`)); 
