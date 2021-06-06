const { admin, db } = require('../util/admin');
const moment = require('moment');
const { htmlToText } = require('html-to-text');

//========================  Create New Job  ========================//
exports.addNewJob = (req, res) => {
    const newJob = {
        jobTitle: req.body.jobTitle,
        numberOfPositions: req.body.numberOfPositions,
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
                    //numberOfPositions: docRef.data().numberOfPositions,
                    //numberOfHired: docRef.data().numberOfHired,
                    //appliedCandidates: docRef.data().appliedCandidates,
                    //interviewedCandidates: docRef.data().interviewedCandidates,
                    //submittedCandidates: docRef.data().submittedCandidates,
                    city: docRef.data().city,
                    state: docRef.data().state,
                    zipCode: docRef.data().zipCode,
                    createdOn: docRef.data().createdOn,
                    daysPosted: moment().diff(moment(docRef.data().createdOn), 'days'),
                    //modifiedBy: docRef.data().modifiedBy,
                    jobDescription: docRef.data().jobDescription,
                    
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