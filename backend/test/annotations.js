//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

const CREDENTIALS = {
    VALID: {
        "email": "h2oAdmin@mail.com",
        "password": "beWater"
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

const versionId = '58f60b4653488f2c34ba348b';
describe('Annotations routes tests', () => {
    let token;
    let annotationId;
    let skippedAnnotationId;

    before(function (done) {
        chai.request(server)
            .post('/api/auth/login')
            .send(CREDENTIALS.VALID)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.to.have.property('token');
                token = res.body.token;
                done();
            });
    });

    describe('GET/ annotations list', () => {
        it('it should fails without auth', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/all`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    done();
                });
        });
        it('it should return annotations list', (done) => {
            console.log(`/api/${versionId}/annotations/all`);
            console.log('token', token);
            chai.request(server)
                .get(`/api/${versionId}/annotations/all`)
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.to.have.property('annotations');
                    res.body.annotations.should.be.a('array');
                    annotationId = res.body.annotations[0]._id;
                    skippedAnnotationId = res.body.annotations[0]._id;
                    done();
                });
        });
        it('it should paginate plans list with skip and limit', (done) => {
            const limit = 2;
            const skip = 1;
            chai.request(server)
                .get(`/api/${versionId}/annotations/all?limit=${limit}&skip=${skip}`)
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.to.have.property('annotations');
                    res.body.annotations.should.be.a('array');
                    res.body.annotations.length.should.be.equal(limit);
                    res.body.annotations[0]._id.should.be.not.equal(skippedAnnotationId);
                    done();
                });
        });
        it('it should NOT return plans list with wrong token', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/all`)
                .set('authorization', 'Bearer ANY_WRONG_TOKEN')
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });

    describe('GET/ annotation item', () => {
        it('it should fails without auth', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/${annotationId}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should return annotation item', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/${annotationId}`)
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.to.have.property('annotation');
                    res.body.annotation.should.be.a('object');
                    res.body.annotation.should.to.have.property('_id');
                    done();
                });
        });
        it('it should fail on wrong param', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/iwqqq`)
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should be failed to find record with wrong ID', (done) => {
            chai.request(server)
                .get(`/api/${versionId}/annotations/58eb97d0f594ce70a4e037b2`)
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });

    });

    describe('PUT/ annotation item', () => {
        it('it should fails without auth', (done) => {
            chai.request(server)
                .put(`/api/${versionId}/annotations/${annotationId}`)
                .send({content: "CHANGED?"})
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should successfully modify annotation', (done) => {
            chai.request(server)
                .put(`/api/${versionId}/annotations/${annotationId}`)
                .send({content: "CHANGED?"})
                .set('authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.to.have.property('annotation');
                    res.body.annotation.should.be.a('object');
                    res.body.annotation.should.to.have.property('_id');
                    res.body.annotation.content.should.to.be.equal('CHANGED?');
                    done();
                });
        });


    });

});