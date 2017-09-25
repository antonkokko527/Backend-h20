const PERMISSONS = require('../constants/permissions');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roleSchema = new Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String, enum: Object.values(PERMISSONS) }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
