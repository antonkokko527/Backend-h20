const leftPad = require('left-pad');
const Counter = require('../models/counter');

function encode(number, minLength = 3) {
    const alphabets = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    const base = alphabets.length;
    let encoded = '';
    let num = number;
    while (num) {
        const remainder = num % base;
        num = Math.floor(num / base);
        encoded = alphabets[remainder].toString() + encoded;
    }
    if (encoded.length < minLength) {
        encoded = leftPad(encoded, minLength, alphabets[0]);
    }
    return encoded;
}

function getShortId() {
    return Counter.findOne()
    .then((counter) => {
        if (!counter) {
            const newCounter = new Counter({ count: 0 });
            return newCounter.save();
        }

        return counter;
    })
    .then((counter) => {
        Object.assign(counter, { count: counter.count + 1 });
        return counter.save();
    })
    .then(counter => encode(counter.count));
}

module.exports = {
    getShortId,
    encode
};
