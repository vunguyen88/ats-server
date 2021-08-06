const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

exports.validateSignupData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(data.password)) errors.password = 'Must not be empty'

    // if(Object.keys(errors).length > 0) return res.status(400).json(errors);
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) errors.email = 'Must not be empty';
    if(isEmpty(data.password)) errors.password = 'Must not be empty';

    // if(Object.keys(errors).length > 0) return res.status(400).json(errors);
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.toPhoneFormat = (phone) => {
    return "+1 "+"("+(phone.slice(0,3)+")" + ' ' + phone.slice(3,6) + '-' + phone.slice(6,10))
}

// exports.sortMessages = (messages) => {
//     let newMessages = {}
//     messages.forEach(message => {
//         if (message.senderId in newMessages) {
//             newMessages[`${message.senderId}`]
//             newMessages[`${message.senderId}`].messages.push({ 
//                 body: message.body, 
//                 status: message.status, 
//                 title: message.title, 
//                 createdOn: message.createdOn, 
//                 senderName: message.senderName, 
//                 senderId: message.senderId, 
//                 messageId: message.id, 
//                 avatarUrl: message.avatarUrl 
//             })
//         } else {
//             newMessages[`${message.senderId}`] = {messages: []}
//             newMessages[`${message.senderId}`].messages.push({ 
//                 body: message.body, 
//                 status: message.status, 
//                 title: message.title, 
//                 createdOn: message.createdOn, 
//                 senderName: message.senderName, 
//                 senderId: message.senderId, 
//                 messageId: message.id, 
//                 avatarUrl: message.avatarUrl,
//                 //unreadCount: 0 
//             })      
//         }
//     })
//     console.log('newMessages ', newMessages)
//     return newMessages;
// }

exports.sortMessages = (messages) => {
    let newMessages = {}
    messages.forEach(message => {
        if (message.senderId in newMessages) {
            if (message.status === 'pending') {
                newMessages[`${message.senderId}`].unreadCount++
            }
        } else {
            newMessages[`${message.senderId}`] = {senderName: message.senderName, senderId: message.senderId, createdOn: message.createdOn, body: message.body, avatarUrl: message.avatarUrl, unreadCount: message.status === 'pending' ? 1 : 0}
        }
    })
    console.log('newMessages ', newMessages)
    return newMessages;
}

exports.groupMessagesIntoSender = (messages) => {
    let newMessages = {}
    messages.forEach(message => {
        if (message.senderId in newMessages) {
            newMessages[`${message.senderId}`].messages.push({ body: message.body, status: message.status, title: message.title, createdOn: message.createdOn })
        } else {
            newMessages[`${message.senderId}`] = {messages: [], senderName: message.senderName, avatarUrl: message.avatarUrl}
            newMessages[`${message.senderId}`].messages.push({ body: message.body, status: message.status, title: message.title, createdOn: message.createdOn })
        }
    })
    return newMessages;
}