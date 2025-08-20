const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let testId; // store _id of an issue for PUT and DELETE tests

  // 1. Create an issue with every field
  test('Create an issue with every field: POST request', function(done) {
    chai.request(server)
      .post('/api/issues/test-project')
      .send({
        issue_title: 'Test issue',
        issue_text: 'Functional test text',
        created_by: 'Tester',
        assigned_to: 'Chai',
        status_text: 'In QA'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Test issue');
        assert.equal(res.body.issue_text, 'Functional test text');
        assert.equal(res.body.created_by, 'Tester');
        assert.equal(res.body.assigned_to, 'Chai');
        assert.equal(res.body.status_text, 'In QA');
        assert.equal(res.body.open, true);
        assert.exists(res.body._id);
        testId = res.body._id; // save _id for later tests
        done();
      });
  });

  // 2. Create an issue with only required fields
  test('Create an issue with only required fields: POST request', function(done) {
    chai.request(server)
      .post('/api/issues/test-project')
      .send({
        issue_title: 'Required fields only',
        issue_text: 'Required text',
        created_by: 'Tester'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.equal(res.body.open, true);
        assert.exists(res.body._id);
        done();
      });
  });

  // 3. Create an issue with missing required fields
  test('Create an issue with missing required fields: POST request', function(done) {
    chai.request(server)
      .post('/api/issues/test-project')
      .send({
        issue_title: 'Missing text'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  // 4. View issues on a project
  test('View issues on a project: GET request', function(done) {
    chai.request(server)
      .get('/api/issues/test-project')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.property(res.body[0], 'issue_title');
        assert.property(res.body[0], 'issue_text');
        assert.property(res.body[0], 'created_by');
        assert.property(res.body[0], 'assigned_to');
        assert.property(res.body[0], 'status_text');
        assert.property(res.body[0], 'open');
        assert.property(res.body[0], '_id');
        done();
      });
  });

  // 5. View issues with one filter
  test('View issues on a project with one filter: GET request', function(done) {
    chai.request(server)
      .get('/api/issues/test-project')
      .query({ open: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        res.body.forEach(issue => assert.equal(issue.open, true));
        done();
      });
  });

  // 6. View issues with multiple filters
  test('View issues on a project with multiple filters: GET request', function(done) {
    chai.request(server)
      .get('/api/issues/test-project')
      .query({ open: true, created_by: 'Tester' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        res.body.forEach(issue => {
          assert.equal(issue.open, true);
          assert.equal(issue.created_by, 'Tester');
        });
        done();
      });
  });

  // 7. Update one field on an issue
  test('Update one field on an issue: PUT request', function(done) {
    chai.request(server)
      .put('/api/issues/test-project')
      .send({ _id: testId, issue_text: 'Updated text' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  // 8. Update multiple fields on an issue
  test('Update multiple fields on an issue: PUT request', function(done) {
    chai.request(server)
      .put('/api/issues/test-project')
      .send({ _id: testId, issue_text: 'Multi update', status_text: 'Done' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  // 9. Update an issue with missing _id
  test('Update an issue with missing _id: PUT request', function(done) {
    chai.request(server)
      .put('/api/issues/test-project')
      .send({ issue_text: 'No _id' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  // 10. Update an issue with no fields to update
  test('Update an issue with no fields to update: PUT request', function(done) {
    chai.request(server)
      .put('/api/issues/test-project')
      .send({ _id: testId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: testId });
        done();
      });
  });

  // 11. Delete an issue
  test('Delete an issue: DELETE request', function(done) {
    chai.request(server)
      .delete('/api/issues/test-project')
      .send({ _id: testId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: testId });
        done();
      });
  });

  // 12. Delete an issue with invalid _id
  test('Delete an issue with invalid _id: DELETE request', function(done) {
    chai.request(server)
      .delete('/api/issues/test-project')
      .send({ _id: '64abc123abc123abc123abcd' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: '64abc123abc123abc123abcd' });
        done();
      });
  });

  // 13. Delete an issue with missing _id
  test('Delete an issue with missing _id: DELETE request', function(done) {
    chai.request(server)
      .delete('/api/issues/test-project')
      .send({})
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

});
