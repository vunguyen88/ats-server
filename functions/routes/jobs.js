const { admin, db } = require('../util/admin');
const Busboy = require('busboy');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
const moment = require('moment');
const { htmlToText } = require('html-to-text');

//========================  Create New Job  ========================//
exports.addNewJob = (req, res) => {
    const newJob = {
        jobTitle: req.body.jobTitle,
        numberOfPositions: parseInt(req.body.numberOfPositions),
        employmentType: req.body.employmentType,
        createdOn: new Date().toISOString(),
        clientName: req.body.clientName,
        displayPriority: req.body.displayPriority,
        jobStatus: req.body.jobStatus,
        workExperience: req.body.workExperience,
        pay: req.body.pay,
        industry: req.body.industry,
        targetDate: req.body.targetDate,
        skillSet: req.body.skillSet,
        jobPosition: req.body.jobPosition,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        jobDescription: req.body.jobDescription,
        appliedCandidates: [],
    };

    db.collection('jobs').add(newJob)
        .then(docRef => {
            res.status(201).json({ message: `document ${docRef.id} created successfully` })
        })
        .catch(err => {
            res.status(5000).json({ error: 'something went wrong' });
            console.error(err);
        })
}

//=======================  Update Company Logo  ======================//
exports.updateCompanyLogo = (req, res) => {
    console.log('ROUTE HIT ', req.params.id);
    console.log('req.body ', req.body)
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    let fileToBeUpload = {};
    let userProfile = {};
    // let appliedOn = new Date().toISOString();
    // Busboy parse fileds and value from form-data

    // Busboy parse file from form-data
    // busboy.on('field', (fieldname, val) => {
    //     userProfile[fieldname] = val;
    //     console.log(`Process ${fieldname} value ${val}`)
    // })

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
                    destination: `jobs/${req.params.id}`,
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
                //userProfile.imgUrl = metadata.mediaLink
                return db.doc(`/jobs/${req.params.id}`).update({
                    logoUrl: metadata.mediaLink
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

//=======================  Get Job Listings  ========================//
exports.getJobListings = (req, res) => {
    console.log('API HIT ');
    let jobListings = [];
    db.collection('jobs').where('jobStatus', '==', 'in-progress').get()
        .then(querySnapshot => {
            querySnapshot.forEach(docRef => (
                jobListings.push({
                    jobTitle: docRef.data().jobTitle,
                    jobId: docRef.id,
                    industry: docRef.data().industry,
                    //createdBy: docRef.data().createdBy,
                    //assignedRecruiter: docRef.data().assignedRecruiter,
                    employmentType: docRef.data().employmentType,
                    jobSummary: htmlToText(docRef.data().jobDescription.slice(0,450)),
                    workExperience: docRef.data().workExperience,
                    skillSet: docRef.data().skillSet,
                    targetDate: docRef.data().targetDate,
                    jobStatus: docRef.data().jobStatus,
                    clientName: docRef.data().clientName,
                    numberOfPositions: docRef.data().numberOfPositions,
                    //numberOfHired: docRef.data().numberOfHired,
                    appliedCandidates: docRef.data().appliedCandidates,
                    //interviewedCandidates: docRef.data().interviewedCandidates,
                    //submittedCandidates: docRef.data().submittedCandidates,
                    city: docRef.data().city,
                    state: docRef.data().state,
                    zipCode: docRef.data().zipCode,
                    createdOn: docRef.data().createdOn,
                    daysPosted: moment().diff(moment(docRef.data().createdOn), 'days'),
                    //modifiedBy: docRef.data().modifiedBy,
                    jobDescription: docRef.data().jobDescription,
                    logoUrl: docRef.data().logoUrl,
                })
            ))
            console.log('return jobs ', jobListings)
            return res.json(jobListings)
        })
        .catch(err => {
            console.error(err);
            return res.json({ error: err })
        })
}

//==========================  Get All Job  ============================//
exports.getAllJobs = (req, res) => {
    console.log('API HIT ');
    let jobs = [];
    db.collection('jobs').get()
        .then(querySnapshot => {
            querySnapshot.forEach(docRef => (
                jobs.push({
                    ...docRef.data(),
                    jobId: docRef.id,
                })
            ))
            console.log('return jobs ', jobs)
            return res.json(jobs)
        })
        .catch(err => {
            console.error(err);
            return res.json({ error: err })
        })
}

//========================  Get Job with Id  =========================// 
exports.getJobWithId = (req, res) => {
    console.log('params ', req.params.id)
    db.doc(`/jobs/${req.params.id}`).get()
        .then(docSnapshot => {
            console.log({ ...docSnapshot.data() })
            res.json({ ...docSnapshot.data() })
        })
        .catch(err => {
            console.error(err)
            res.json({ error: err })
        })
}