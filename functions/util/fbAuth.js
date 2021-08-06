const { db, admin } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized' });
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = {};
            req.user.email = decodedToken.email;
            req.user.uid = decodedToken.uid;
            console.log('REQ.USER ', req.user.email);
            return db.collection('users')
                .where('email', '==', req.user.email )
                .limit(1)
                .get()
        })
        .then(data => {
            req.user.userId = data.docs[0].id;
            req.user.firstName = data.docs[0].data().firstName;
            req.user.lastName = data.docs[0].data().lastName;
            req.user.role = data.docs[0].data().role;
            req.user.avatarUrl = data.docs[0].data().avatarUrl;
            req.user.createdOn = data.docs[0].data().createdOn;
            req.user.department = data.docs[0].data().department;
            req.user.jobTitle = data.docs[0].data().jobTitle;
            req.user.join = data.docs[0].data().join;
            req.user.address = req.user.address ? data.docs[0].data().address : '';
            req.user.city = req.user.city ? data.docs[0].data().city : '';
            req.user.state = req.user.address ? data.docs[0].data().state : '';
            req.user.zipCode = req.user.address ? data.docs[0].data().zipCode : '';
            req.user.country = req.user.country ? data.docs[0].data().country : '';
            req.user.gender = req.user.gender ? data.docs[0].data().gender : '';
            req.user.language = req.user.language ? data.docs[0].data().language : '';
            req.user.dob = data.docs[0].data().dob;
            req.user.twitter = req.user.twitter ? data.docs[0].data().twitter : '';
            req.user.linkedin = req.user.linkedin ? data.docs[0].data().linkedin : '';
            req.user.facebook = req.user.facebook ? data.docs[0].data().facebook : '';
            req.user.emergencyName = req.user.emergencyName ? data.docs[0].data().emergencyName : '';
            req.user.emergencyNumber = req.user.emergencyNumber ? data.docs[0].data().emergencyNumber : '';
            req.user.emergencyRelationship = req.user.emergencyRelationship ? data.docs[0].data().emergencyRelationship : '';
            //console.log('user data after auth ', req.user)
            return next();
        })
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}