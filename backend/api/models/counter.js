const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const counteSchema = new Schema({
    count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counteSchema);
