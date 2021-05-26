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
exports.candidateFirstApply = (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    let fileToBeUpload = {};
    let candidateInfo = {};

    // Busboy parse fileds and value from form-data
    busboy.on('field', (fieldname, val) => {
        candidateInfo[fieldname] = val;
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
        admin.storage().bucket('applicant-tracking-syste-74466.appspot.com').upload(fileToBeUpload.filepath, {
            gzip: true,
            destination: `resume/${candidateInfo.firstName + candidateInfo.lastName}`,
            redefineAcl: 'publicRead',
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
            // Get file Url after upload success
            candidateInfo.resumeUrl = metadata.mediaLink
            // Check if candidate already have an email signup
            return db.collection('candidates').where('email', '==', candidateInfo.email).get()
            // return res.json({ message: 'upload success' })
        })
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                return res.json({ message: 'candidate already has an account' })
            } else {
                // Automatic create new account for candidate with default password '123456'
                return firebase.auth().createUserWithEmailAndPassword(candidateInfo.email, '123456')
            }
        })
        .then(data => {
            // get user UID after create candidate authentication
            candidateInfo.userUID = data.user.uid;
            return db.collection('candidates').add(candidateInfo)
        })
        .then(data => {
            return res.status(201).json({ message: 'success' })
        })
        .catch(err => {
            console.error(err);
            return res.json({ error: err })
        })
    })
    busboy.end(req.rawBody);
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