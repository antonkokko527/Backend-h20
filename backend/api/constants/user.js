module.exports = {
    STATUS: {
        PENDING: 0,
        ACTIVE: 1,
        BLOCKED: 2,
        DELETED: 3
    },
    USER_ALLOWED_FIELDS: ['firstname', 'lastname', 'avatar', 'username', 'email'],
    ADMIN_ALLOWED_FIELDS: ['firstname', 'lastname', 'avatar', 'status', 'role', 'username', 'email'],
    POPULATE: { path: 'author', select: 'firstname lastname role -_id' }
};
