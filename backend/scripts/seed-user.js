const mongoose = require('mongoose');
const config = require('../config/config');
const Role = require('../api/models/role');
const User = require('../api/models/user');
const constants = require('../api/constants/user');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongoURL);

mongoose.connection.on('error', () => {
    throw new Error(`Unable to connect to database: ${config.mongoURL}`);
});

mongoose.connection.on('open', () => {
    Role.findOne({ name: 'ADMIN' })
    .then((role) => {
        const user = new User({
            email: 'h2oAdmin@mail.com',
            username: 'admin',
            password: '$2a$10$bO7H6h5vByGioPyx8fl0UOXOqMIBMx6/U/M3R86MC0V8MpM5Q7Ns6',
            firstname: 'H20',
            lastname: 'Admin',
            status: constants.STATUS.ACTIVE,
            teams: [],
            role
        });

        return user.save();
    })
    .then(() => {
        mongoose.connection.close();
        console.log('SUCCESS');
    })
    .catch((err) => {
        console.error(err);
    });
});
