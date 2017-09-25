const mongoose = require('mongoose');
const config = require('../config/config');
const Role = require('../api/models/role');
const PERMISSONS = require('../api/constants/permissions');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongoURL);

mongoose.connection.on('error', () => {
    throw new Error(`Unable to connect to database: ${config.mongoURL}`);
});

mongoose.connection.on('open', () => {
    const adminRole = new Role({
        name: 'ADMIN',
        permissions: [PERMISSONS.SYSTEM, PERMISSONS.READ, PERMISSONS.WRITE, PERMISSONS.MODERATOR]
    });
    const teamLeadRole = new Role({
        name: 'TEAM_LEAD',
        permissions: [PERMISSONS.READ, PERMISSONS.WRITE, PERMISSONS.MODERATOR]
    });
    const teamOperatorRole = new Role({
        name: 'TEAM_OPERATOR',
        permissions: [PERMISSONS.READ]
    });
    Promise.all([
        adminRole.save(),
        teamLeadRole.save(),
        teamOperatorRole.save()
    ])
    .then(() => {
        mongoose.connection.close();
        console.log('SUCCESS');
    })
    .catch((err) => {
        console.error(err);
    });
});
