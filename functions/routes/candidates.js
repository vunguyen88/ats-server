const { admin, db } = require('../util/admin');
const Busboy = require('busboy');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
// const config = require('../util/config');

const firebase = require('firebase');
// firebase.initializeApp(config);

//========================  Candidate First Apply For Job  ========================//
/* Candidate first apply to job will automatically create an account in database, 
   Candidate will require to log in if apply to another job */ 
// exports.candidateFirstApply = (req, res) => {
//     console.log('ROUTE HIT ');
//     console.log('req.body ', req.body)
//     const busboy = new Busboy({ headers: req.headers });
//     const tmpdir = os.tmpdir();
//     let fileToBeUpload = {};
//     let candidateInfo = {};

//     // Busboy parse fileds and value from form-data
//     busboy.on('field', (fieldname, val) => {
//         candidateInfo[fieldname] = val;
//         console.log(`file ${fieldname} value ${val}`)
//     })

//     // Busboy parse file from form-data
//     busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
//         const filepath = path.join(tmpdir, filename);
//         const writeStream = fs.createWriteStream(filepath);
//         fileToBeUpload = { filepath, mimetype };
// 		file.pipe(writeStream);
//     })

//     busboy.on('finish', () => {
//         console.log('FILE IS: ', fileToBeUpload.filepath)
//         admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').upload(fileToBeUpload.filepath, {
//             gzip: true,
//             destination: `resume/${candidateInfo.firstName + candidateInfo.lastName}`,
//             redefineAcl: 'publicRead',
//             metadata: {
//                 cachControl: 'public, max-age=31536000',
//             },
//         })
//         .then(result => {
//             const uploadedFile = result[0];
//             // Get file metadata after upload file success
//             return uploadedFile.getMetadata()
//         })
//         .then(result => {
//             const metadata = result[0];
//             // Get file Url after upload success
//             candidateInfo.resumeUrl = metadata.mediaLink
//             // Check if candidate already have an email signup
//             return db.collection('candidates').where('email', '==', candidateInfo.email).get()
//             // return res.json({ message: 'upload success' })
//         })
//         .then(querySnapshot => {
//             if (!querySnapshot.empty) {
//                 return res.json({ message: 'candidate already has an account' })
//             } else {
//                 // Automatic create new account for candidate with default password '123456'
//                 return firebase.auth().createUserWithEmailAndPassword(candidateInfo.email, '123456')
//             }
//         })
//         .then(data => {
//             // get user UID after create candidate authentication
//             candidateInfo.userUID = data.user.uid;
//             return db.collection('candidates').add(candidateInfo)
//         })
//         .then(data => {
//             return res.status(201).json({ message: 'success' })
//         })
//         .catch(err => {
//             console.error(err);
//             return res.json({ error: err })
//         })
//     })
//     busboy.end(req.rawBody);
// }

exports.candidateFirstApply = (req, res) => {
    console.log('ROUTE HIT ');
    console.log('req.body ', req.body)
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    let fileToBeUpload = {};
    let candidateInfo = {};
    let appliedOn = new Date().toISOString();
    // Busboy parse fileds and value from form-data
    busboy.on('field', (fieldname, val) => {
        candidateInfo[fieldname] = val;
        console.log(`file ${fieldname} value ${val}`)
    })

    // Busboy parse file from form-data
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const filepath = path.join(tmpdir, filename);
        const writeStream = fs.createWriteStream(filepath);
        fileToBeUpload = { filepath, mimetype };
		file.pipe(writeStream);
    })

    busboy.on('finish', () => {
        console.log('FILE IS: ', fileToBeUpload.filepath)
        console.log('job id ', req.params.jobId)
        db.collection('candidates').where('email', '==', candidateInfo.email).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    console.log('Please login to apply for job')
                    return res.json({ message: 'candidate already has an account' })
                } else {
                    // Automatic create new account for candidate with default password '123456'
                    return firebase.auth().createUserWithEmailAndPassword(candidateInfo.email, '123456')
                }
            })
            .then(data => {
                // get user UID after create candidate authentication
                candidateInfo.userUID = data.user.uid;
                //return db.collection('candidates').add(candidateInfo)
                return admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').upload(fileToBeUpload.filepath, {
                    gzip: true,
                    destination: `resume/${candidateInfo.firstName + ' ' + candidateInfo.lastName + '-' + candidateInfo.userUID}`,
                    public: true,
                    metadata: {
                        cachControl: 'public, max-age=31536000',
                    },
                })
            })
            .then(result => {
                const uploadedFile = result[0];
                // Get file metadata after upload file success
                return uploadedFile.getMetadata()
            })
            .then(result => {
                const metadata = result[0];
                // Get file Url after upload success
                candidateInfo.resumeUrl = metadata.mediaLink
                candidateInfo.appliedJobs = [{ jobTitle: candidateInfo.jobTitle, jobId: req.params.jobId, clientName: candidateInfo.clientName, appliedOn, status: 'pending', city: candidateInfo.city }]
                // Check if candidate already have an email signup
                return db.collection('candidates').add(candidateInfo)
            })
            .then(docRef => {
                return db.doc(`/jobs/${req.params.jobId}`).update({ appliedCandidates: admin.firestore.FieldValue.arrayUnion({ candidateId: docRef.id, candidateName: candidateInfo.firstName + ' ' + candidateInfo.lastName, email: candidateInfo.email,resume: candidateInfo.resumeUrl, appliedOn, status: 'pending' })})
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

//========================  Get All Candidates  =========================// 
exports.getAllCandidates = (req, res) => {
    db.collection('candidates').get()
        .then(querySnapshot => {
            let candidateList = []
            querySnapshot.forEach(candidate => {
                candidateList.push({
                    ...candidate.data(), candidateId: candidate.id  
                })
            })
            res.json(candidateList)
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}

//========================  Get Candidate with Id  =========================// 
exports.getCandidateWithId = (req, res) => {
    console.log('params ', req.params.id)
    db.doc(`/candidates/${req.params.id}`).get()
        .then(docSnapshot => {
            console.log({ ...docSnapshot.data() })
            res.json({ ...docSnapshot.data() })
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}

//========================  Get List OF Resumes  ========================// 
exports.getAllResume = (req, res) => {
    admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').getFiles()
        .then(files => {
            console.log('files list ', files[0])
            console.log('files list method ', files[0].methods)
            res.json(files[0])
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}

//========================  Get File Metadata Knowing Filename  ========================// 
exports.getResumeFile = (req, res) => {
    admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').file('resume/phucnguyen').getMetadata()
        .then(file => {
            console.log('file res ', file)
            // console.log('files list method ', files[0].methods)
            res.json(file)
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}

//========================  Delete Resume Knowing Filename  ========================// 
exports.deleteResume = (req, res) => {
    admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').file('resume/phucnguyen').delete()
        .then(deleteFileRes => {
            console.log(deleteFileRes)
            return res.json({ message: 'file deleted' })
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}

// //========================  Update Resume  ========================// 
// exports.updateResume = (req, res) => {
//     admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').file('resume/phucnguyen').delete()
//         .then(deleteFileRes => {
//             console.log(deleteFileRes)
//             return res.json({ message: 'file deleted' })
//         })
//         .catch(err => {
//             console.error(err)
//             res.json({ error: err })
//         })
// }