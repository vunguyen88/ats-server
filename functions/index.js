const functions = require("firebase-functions");
const cors = require('cors')
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const { 
    getAllUsers, 
    getUserWithId,
    createNewUser, 
    signup, 
    login ,
    getUserProfile,
    updateUserProfile,
    updateUserProfilePicture,
    sendMessageToUser,
    getUserMessages,
    requestTimeoff,
} = require('./routes/users');

const { 
    candidateFirstApply, 
    getAllResume, 
    getResumeFile, 
    deleteResume, 
    getAllCandidates,
    getCandidateWithId, 
} = require('./routes/candidates');

const {
    addNewJob,
    getJobListings,
    getAllJobs,
    getJobWithId,
    updateCompanyLogo,
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
app.get('/users', FBAuth, getAllUsers);



// Create new user route
// app.post('/user', FBAuth, createNewUser);


//===========================  user routes  ==========================//
app.post('/signup', signup);
app.post('/login', login);
app.get('/users/:id', FBAuth, getUserWithId);
app.get('/profile', FBAuth, getUserProfile);
app.put('/profile/update', updateUserProfile);
app.put('/profile/picture/update', updateUserProfilePicture);
app.post('/users/:id/messages', FBAuth, sendMessageToUser);
app.get('/users/currentuser/messages', FBAuth, getUserMessages);
app.post('/users/:id/timeoff/reqest', FBAuth, requestTimeoff);

//========================  candidates routes  ========================//
app.post('/jobs/:jobId/apply', candidateFirstApply);
app.get('/getallresumes', FBAuth, getAllResume);
app.get('/getresumefile', FBAuth, getResumeFile);
app.delete('/deleteresume', FBAuth, deleteResume);
app.get('/candidates', FBAuth, getAllCandidates);
app.get('/candidates/:id', FBAuth, getCandidateWithId);

//===========================  job routes  ============================//
app.post('/newjob', FBAuth, addNewJob);
app.get('/jobs', getJobListings);
app.get('/alljobs', FBAuth, getAllJobs);
app.get('/jobs/:id', FBAuth, getJobWithId);
app.put('/jobs/:id/logo', FBAuth, updateCompanyLogo);

// https://baseurl.com/api/

exports.api = functions.region('us-east1').https.onRequest(app);