const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testId; // we’ll reuse this across tests

suite('Functional Tests', function() {
  
  suite('POST /api/issues/{project} => object with issue data', function() {
    
    test('Create an issue with every field', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Test Issue',
          issue_text: 'Functional test',
          created_by: 'FCC',
          assigned_to: 'Chai',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Test Issue');
          assert.equal(res.body.issue_text, 'Functional test');
          assert.equal(res.body.created_by, 'FCC');
          assert.equal(res.body.assigned_to, 'Chai');
          assert.equal(res.body.status_text, 'In QA');
          assert.isTrue(res.body.open);
          testId = res.body._id; // save for later
          done();
        });
    });
    
    test('Create an issue with only required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Required only',
          issue_text: 'No extras',
          created_by: 'FCC'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Required only');
          assert.equal(res.body.issue_text, 'No extras');
          assert.equal(res.body.created_by, 'FCC');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.isTrue(res.body.open);
          done();
        });
    });
    
    test('Create an issue with missing required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: '',
          issue_text: '',
          created_by: ''
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'required field(s) missing');
          done();
        });
    });

  });
  
  suite('GET /api/issues/{project} => Array of issues', function() {
    
    test('View issues on a project', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
    });
    
    test('View issues on a project with one filter', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({ created_by: 'FCC' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          res.body.forEach(issue => {
            assert.equal(issue.created_by, 'FCC');
          });
          done();
        });
    });
    
    test('View issues on a project with multiple filters', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({ created_by: 'FCC', open: true })
        .end(function(err, res){
          assert.equal(res.status, 200);
          res.body.forEach(issue => {
            assert.equal(issue.created_by, 'FCC');
            assert.isTrue(issue.open);
          });
          done();
        });
    });

  });
  
  suite('PUT /api/issues/{project} => text', function() {
    
    test('Update one field on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId,
          issue_text: 'Updated text'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
          done();
        });
    });
    
    test('Update multiple fields on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId,
          issue_title: 'Updated title',
          open: false
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
          done();
        });
    });
    
    test('Update an issue with missing _id', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ issue_text: 'No ID' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });
    
    test('Update an issue with no fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ _id: testId })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: testId });
          done();
        });
    });
    
    test('Update an issue with an invalid _id', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({ _id: 'badid123', issue_text: 'Nope' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', _id: 'badid123' });
          done();
        });
    });

  });
  
  suite('DELETE /api/issues/{project} => text', function() {
    
    test('Delete an issue', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({ _id: testId })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', _id: testId });
          done();
        });
    });
    
    test('Delete an issue with an invalid _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({ _id: 'invalidid123' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalidid123' });
          done();
        });
    });
    
    test('Delete an issue with missing _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

  });

});
// this code passe