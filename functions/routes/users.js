const { admin, db } = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData, validateLoginData } = require('../util/validators');

//========================  Login  ========================//
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);

   
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            console.log('ID TOKEN ', token)
            return res.json({ token })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
}

//========================  Signup  ========================//
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        userUID: ''
    };

    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    let idToken, userId;
    db.collection('users').where('email', '==', newUser.email).get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                return res.status(500).json({ error: 'email already exists' })
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        . then(data => {
            newUser.userUID = data.user.uid;
            return data.user.getIdToken();
        })
        .then (token => {
            console.log('token ', token)
            idToken = token;
            const userCredentials = {
                email: newUser.email,
                createdAt: new Date().toISOString(),
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                userUID: newUser.userUID,
                role: newUser.role,
            };
            return db.collection('users').add(userCredentials);
        })
        .then(data => {
            return res.status(201).json({ idToken })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}

//========================  Get All Users  ========================//
exports.getAllUsers = (req, res) => {
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(data => {
            let users = [];
            data.forEach(doc => {
                users.push({
                    userId: doc.id,
                    ...doc.data(),
                })
            });
            return res.json(users);
        })
        .catch(err => {
            console.error(err);
        })
}

//========================  Create New User  ========================//
// exports.createNewUser = (req, res) => {
//     const newUser = {
//         firstName: req.body.firstName,
//         lastName: req.body.lastName,
//         //userId: req.user.userId,
//         createdAt: admin.firestore.Timestamp.fromDate(new Date())
//     };

//     db.collection('users').add(newUser).then(doc => {
//         res.json({ message: `document ${doc.id} created successfully` })
//     })
//     .catch(err => {
//         res.status(5000).json({ error: 'something went wrong' });
//         console.error(err);
//     })
// }


