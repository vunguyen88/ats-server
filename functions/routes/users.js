const { admin, db } = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const Busboy = require('busboy');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { validateSignupData, validateLoginData, toPhoneFormat, sortMessages, groupMessagesIntoSender } = require('../util/validators');

//========================  Login  ========================//
exports.login = (req, res) => {
    // console.log('body ', req.body)
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
    console.log('body ', req.body)
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        userUID: ''
    };
    const welcomeMessage = {
        body: `Hello ${newUser.firstName + ' ' + newUser.lastName} and welcome to my personal project.`,
        senderId: 'BDTKgWCvy2CHDbtiwYpJ',
        createdOn: new Date().toISOString(),
        senderName: 'Vu Nguyen',
        status: 'pending'
    }

    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);
    let docId;
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
            idToken = token;
            const userCredentials = {
                email: newUser.email.toLowerCase(),
                createdAt: new Date().toISOString(),
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                userUID: newUser.userUID,
                role: 'guest',
                gender: '',
                address: '',
                avatarUrl: '',
                city: '',
                country: '',
                company: '',
                department: '',
                manager: 'Vu Nguyen',
                managerId: 'BDTKgWCvy2CHDbtiwYpJ',
                dob: '',
                emergencyContactName: '',
                emergencyContactNumber: '',
                emergencyContactRelationship: '',
                facebook: '',
                jobTitle: '',
                join: '2021',
                language: '',
                linkedin: '',
                phone: '',
                state: '',
                twitter: '',
                zipCode: '',
                messages: [
                    {
                        sender: 'Vu Nguyen',
                        senderId: 'BDTKgWCvy2CHDbtiwYpJ',
                        body: 'Welcome to my personal project',
                        createdOn: '2021-07-01T01:35:52.667Z',
                        status: 'pending'
                    }
                ],
                notifications: [
                    {
                        body: 'You have new message from Vu Nguyen',
                    }
                ],
                timeoffRequests: [],
                timeoffHours: 80,
                notes: [],
                achievements: [],
                todos: []
            };
            return db.collection('users').add(userCredentials);
        })
        .then(docRef => {
            docId = docRef.id;
            return db.doc(`/users/${docRef.id}`).update({userId: docRef.id})
        })
        .then(() => {
            return db.collection(`users/${docId}/messages`).add(welcomeMessage);
        })
        .then(() => {
            return res.status(201).json({ token: idToken })
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

//========================  Get User With Id  ========================//
exports.getUserWithId = (req, res) => {
    console.log('user id is ', req.params.id)
    db.doc(`/users/${req.params.id}`).get()
        .then(docRef => {
            let userInfo = {};
            userInfo = docRef.data();
            userInfo.phone = toPhoneFormat(userInfo.phone);
            console.log('user info ', userInfo)
            return res.json(userInfo);
        })
        .catch(err => {
            console.error(err);
            res.json({ errors: err})
        })
}

//========================  Get User Profile  ========================//
exports.getUserProfile = (req, res) => {
    let userProfile = {}
    db.collection('users').where('email', '==', req.user.email).get()
        .then(querySnapshot => {
            userProfile = querySnapshot.docs[0].data();
            userProfile.userId = querySnapshot.docs[0].id;
            userProfile.uid = req.user.uid;
            res.json(userProfile)
        })
        .catch(err => {
            console.log(err);
            res.json({ errors: err })
        })
    // .catch(err => {
    //     res.status(5000).json({ error: 'something went wrong' });
    //     console.error(err);
    // })
}

//=======================  Update User Profile  =======================//
exports.updateUserProfile = (req, res) => {
    db.doc(`/users/${req.body.userId}`).update(req.body)
        .then(() => {
            console.log('Document successfully updated!')
            res.json({ message: 'Document successfully updated!'})
        })
        .catch(err => {
            console.log(err)
        })
    
    // .catch(err => {
    //     res.status(5000).json({ error: 'something went wrong' });
    //     console.error(err);
    // })
}

//=====================  Update User Profile Picture ====================//
exports.updateUserProfilePicture = (req, res) => {
    console.log('ROUTE HIT ');
    console.log('req.body ', req.body)
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    let fileToBeUpload = {};
    let userProfile = {};
    // let appliedOn = new Date().toISOString();
    // Busboy parse fileds and value from form-data

    // Busboy parse file from form-data
    busboy.on('field', (fieldname, val) => {
        userProfile[fieldname] = val;
        console.log(`Process ${fieldname} value ${val}`)
    })

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const filepath = path.join(tmpdir, filename);
        const writeStream = fs.createWriteStream(filepath);
        fileToBeUpload = { filepath, mimetype };
		file.pipe(writeStream);
    })

    busboy.on('finish', () => {
        console.log('FILE IS: ', fileToBeUpload.filepath)
                //return db.collection('candidates').add(candidateInfo)
                return admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').upload(fileToBeUpload.filepath, {
                    gzip: true,
                    // destination: `resume/${candidateInfo.firstName + ' ' + candidateInfo.lastName}`,
                    destination: `users/${userProfile.firstName + ' ' + userProfile.lastName + '-' + userProfile.userId}/profile-picture`,
                    //predefinedAcl: 'publicRead',
                    public: true,
                    metadata: {
                        cachControl: 'public, max-age=31536000',
                    },
                })
            
            .then(result => {
                const uploadedFile = result[0];
                // Get file metadata after upload file success
                return uploadedFile.getMetadata()
            })
            .then(result => {
                const metadata = result[0];
                console.log('meta data ', metadata)
                // Get file Url after upload success
                userProfile.imgUrl = metadata.mediaLink
                return db.doc(`/users/${userProfile.userId}`).update({
                    avatarUrl: userProfile.imgUrl
                })
            })
            .then(() => {
                return res.status(201).json({ message: 'success' })
            })
            .catch(err => {
                console.error(err);
                return res.json({ error: err })
            })
    })
    busboy.end(req.rawBody);
}

//========================  Send Message to User  ========================//
exports.sendMessageToUser = (req, res) => {
    console.log('message body ', req.body)
    console.log('sender info ', req.user)
    let message = {
        body: req.body.body, 
        senderId: req.user.userId,
        senderName: req.user.firstName + ' ' + req.user.lastName, 
        createdOn: new Date().toISOString(), 
        status: 'pending' 
    }
    //let userProfile = {}
    db.collection(`/users/${req.params.id}/messages`).add(message)
    // db.doc(`/users/${req.params.id}`).update(
    //     { 
    //         messages: admin.firestore.FieldValue.arrayUnion({ 
    //             body: req.body.body, 
    //             senderId: req.user.userId,
    //             sender: req.user.firstName + ' ' + req.user.lastName, 
    //             createdOn: new Date().toDateString(), 
    //             status: 'pending' 
    //         }),
    //         notifications: admin.firestore.FieldValue.arrayUnion({ 
    //             body: `You received a message from ${req.user.firstName} ${req.user.lastName}`, 
    //             status: 'pending' 
    //         }),
    //     })
        .then(docSnapshot => {
            console.log('send success')
            res.json('success')
        })
        .catch(err => {
            console.log(err);
            res.json({ errors: err })
        })
}

//=========================  Get User Messages  =========================//
exports.getUserMessages = (req, res) => {
    db.collection(`/users/${req.user.userId}/messages`).get()
        .then(querySnapshot => {
            let messages = [];
            let resMessages = {};
            querySnapshot.forEach(queryDocSnapshot => {
                messages.push({
                    id: queryDocSnapshot.id,
                    ...queryDocSnapshot.data()
                })
            })
            console.log(messages)
            const newMessages = sortMessages(messages);
            const senderMess = groupMessagesIntoSender(messages)
            let messageArr = [];
            
            for (id in newMessages) {
                //console.log(`${id}: ${newMessages[id]}`);
                messageArr.push( newMessages[id] )
            } 
            resMessages.sender = messageArr;
            resMessages.senderMessages = senderMess;
            res.json(resMessages)
        })
        .catch(err => {
            console.log(err);
            res.json({ errors: err })
        })
}

//========================  User Request Time Off  =======================//
exports.requestTimeoff = (req, res) => {
    console.log('HITTTTT')
    console.log('message body ', req.body)
    console.log('sender info ', req.params.id);
    let requestList = [];
    db.doc(`/users/${req.params.id}`).update(
        { 
            timeoff: admin.firestore.FieldValue.arrayUnion({ 
                timeoffType: req.body.timeoffType, 
                employeeId: req.user.userId,
                manager: req.body.manager, 
                beginDate: req.body.beginDate,
                endDate: req.body.endDate,
                createdOn: new Date().toISOString(),
                hoursOff: req.body.hoursOff,
                daysOff: req.body.daysOff, 
                status: 'pending' ,
                description: req.body.description,
            }),
        })
        .then(() => {
            console.log('send success')
            res.json('success')
        })
        .catch(err => {
            console.log(err);
            res.json({ errors: err })
        })
}

