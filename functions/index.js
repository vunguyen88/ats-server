const functions = require("firebase-functions");
const cors = require('cors')
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const { getAllUsers, createNewUser, signup, login } = require('./routes/users');
const { candidateFirstApply, getAllResume, getResumeFile, deleteResume } = require('./routes/candidates');

const {
    addNewJob,
    getJobListings,
} = require('./routes/jobs');

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// const firebase = require('firebase');
// const { object } = require("firebase-functions/lib/providers/storage");
// firebase.initializeApp(config);



// Get all user route
app.get('/users', getAllUsers);



// Create new user route
// app.post('/user', FBAuth, createNewUser);


//===========================  user routes  ==========================//
app.post('/signup', signup)
app.post('/login', login);


//========================  candidates routes  ========================//
app.post('/apply', candidateFirstApply);
app.get('/getallresumes', getAllResume);
app.get('/getresumefile', getResumeFile);
app.delete('/deleteresume', deleteResume);


//===========================  job routes  ============================//
app.post('/newjob', addNewJob);
app.get('/jobs', getJobListings);

// https://baseurl.com/api/

exports.api = functions.region('us-east1').https.onRequest(app);