const functions = require("firebase-functions");
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const { getAllUsers, createNewUser, signup, login } = require('./routes/users');
const { candidateFirstApply, getAllResume, getResumeFile, deleteResume } = require('./routes/candidates');


// const firebase = require('firebase');
// const { object } = require("firebase-functions/lib/providers/storage");
// firebase.initializeApp(config);



// Get all user route
app.get('/users', getAllUsers);



// Create new user route
// app.post('/user', FBAuth, createNewUser);



// Signup route
app.post('/signup', signup)
app.post('/login', login);

// Candidate route
app.post('/apply', candidateFirstApply);
app.get('/getallresumes', getAllResume);
app.get('/getresumefile', getResumeFile);
app.delete('/deleteresume', deleteResume);

// https://baseurl.com/api/

exports.api = functions.region('us-east1').https.onRequest(app);