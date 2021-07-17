const express = require('express');
const secureRouter = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const { json } = require('express');

app.use(express.json());
app.use(cors());

MongoClient.connect('mongodb+srv://user001:user001-mongodb-basics@practice.54zqw.mongodb.net/test?retryWrites=true&w=majority', {useUnifiedTopology: true}, (err, client) => {
    if (err) throw err;
    console.log('Database Connected');
    const dbProduct = client.db('product');
    const beansCollection = dbProduct.collection('beans');
    const dbTask003 = client.db('task003');
    const contactsCollection = dbTask003.collection('contacts');
    const usersCollection = dbTask003.collection('users');
    
    app.post('/beans', verifyToken, (req, res) => {
        jwt.verify(req.token, 'secret_key', (err, authData) => {
            if(err) {
                res.sendStatus(403);
            } else {
                res.json({
                    message: "Post jasdklf", authData
                });
            }
        });

        if (!req.body.name) return res.status(400).send('Must have name');
        if (!Number.isInteger(req.body.qty)) return res.status(400).send('Quantity must be an Integer');

        const bean = {
            name: req.body.name,
            qty: req.body.qty
        };
        beansCollection.insertOne(bean);
        res.send(bean);
    });

    app.post('/guest', (req, res) => {
        usersCollection.find({user: req.body.user, password: req.body.password}).toArray((err, result) => {
            if (err) throw err;
            
        });
    });

    passport.use(
        new JWTstrategy({
            secretOrKey: 'A_VERY_SECRET_KEY',
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
        },
        async (token, done) => {
            try {
                return done(null, token.user);
            } catch (error) {
                done(error);
            }
        })
    );
    
    passport.use('signup', new localStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            bcrypt.hash(password, 10, (err, hash) => {
                usersCollection.insertOne({ email, hash });

                usersCollection.findOne({ email, hash }, (err, result) => {
                    return done(null, result);
                });
            });
        } catch (error) {
            done(error);
        }
    }));

    passport.use('login', new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                usersCollection.findOne({ email }, (err, result) => {
                    if(err) throw err;
                    if (!result) return done(null, false, { message: 'User not found' });
                    var user = result;

                    // bcrypt.compare(password, 10, (err, result) => {

                    // });
                    usersCollection.findOne({ email }, (err, r) => {
                        if(err) throw err;
                        console.log(r.hash);
                        bcrypt.compare(password, r.hash, (err, result) => {
                            if(!result) return done(null, false, { message: 'Wrong password' });
                            return done(null, result, { message: 'Logged in Successfully' });
                        });
                    });
                });
            } catch (error) {
                return done(error);
            }
        }
    ));

    app.post('/signup', passport.authenticate('signup', {session: false}),
        async (req, res, next) => {
            res.json({
                message: 'Signup Successful',
                user: req.user
            });
        }
    );

    app.post('/login', async (req, res, next) => {
        passport.authenticate('login', async (err, user, info) => {
            try {
                if (!user) {
                    res.send(info);
                }

                req.login(user, { session: false }, async (error) => {
                    if (error) return next(error);

                    const body = { _id: user._id, email: user.email };
                    const token = jwt.sign({ user: body }, 'A_VERY_SECRET_KEY');
                    return res.json({ token });
                });
            } catch (error) {
                return next(error);
            }
        })(req, res, next)
    });
    

    // app.get('/profile', (req, res, next) => {
    //     res.json({
    //         message: 'Secret Route Entered',
    //         user: req.user,
    //         token: req.query.secret_token
    //     });
    // });

    secureRouter.get('/profile', (req, res, next) => {
        res.json(
            {
                message: 'Secret Route Entered',
                user: req.user,
                token: req.query.secret_token
            }
        );
    });

    secureRouter.post('/contacts', (req, res, next) => {
        const contact = {
            last_name: req.body.last_name,
            first_name: req.body.first_name,
            phone_numbers: req.body.phone_numbers
        };
        contactsCollection.insertOne(contact);
        res.send(contact);
    });

    secureRouter.get('/contacts', (req, res, next) => {
        contactsCollection.find({}).sort({first_name: 1}).toArray((err, result) => {
            if (err) throw err;
            res.send(result);
        });
    });

    secureRouter.put('/contacts/:_id', (req, res, next) => {
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

    secureRouter.delete('/contacts/:_id', (req, res, next) => {
        contactsCollection.deleteOne({_id: new ObjectId(req.params['_id'])}, (err) => {
            if (err) throw err;
            res.send('1 document deleted');
        })
    });


    app.use('/user', passport.authenticate('jwt', { session: false }), secureRouter);

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

    app.delete('/contacts/:_id', (req, res) => {
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

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`)); 
