//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

const CREDENTIALS = {
    VALID: {
        email: 'h2oAdmin@mail.com',
        password: 'beWater'
    },
    INVALID: {
        email: 'admin@mail.com',
        password: 'dddd'
    },
    BAD_FORMAT: {
        email: 'not_mail',
        password: ''
    }
};

describe('/post login', () => {
    it('it should authenticate user', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send(CREDENTIALS.VALID)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('token');
                done();
            });
    });
    it('it should fail on incorrect password or login', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send(CREDENTIALS.INVALID)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.not.property('token');
                done();
            });
    });
    it('it should fail on empty credentials', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.not.property('token');
                done();
            });
    });
    it('it should fail on wrong credentials format', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send(CREDENTIALS.BAD_FORMAT)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.not.property('token');
                done();
            });
    });
});