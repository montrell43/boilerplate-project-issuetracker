'use strict';

const { v4: uuidv4 } = require('uuid');

let issues = []; // In-memory storage for FCC tests

module.exports = function (app) {

  app.route('/api/issues/:project')

    // GET ISSUES
    .get((req, res) => {
      const project = req.params.project;
      let filtered = issues.filter(i => i.project === project);

      // Apply query filters
      Object.keys(req.query).forEach(key => {
        filtered = filtered.filter(i => i[key] == req.query[key]);
      });

      res.json(filtered);
    })

    // CREATE ISSUE
    .post((req, res) => {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const issue = {
        _id: uuidv4(),
        project,
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      issues.push(issue);

      res.json(issue);
    })

    // UPDATE ISSUE
    .put((req, res) => {
      const { _id, ...fields } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      const issue = issues.find(i => i._id === _id && i.project === req.params.project);

      if (!issue) return res.json({ error: 'could not update', _id });

      const updates = Object.keys(fields).filter(
        k => fields[k] !== undefined && fields[k] !== ''
      );

      if (updates.length === 0) return res.json({ error: 'no update field(s) sent', _id });

      updates.forEach(key => issue[key] = fields[key]);
      issue.updated_on = new Date();

      res.json({ result: 'successfully updated', _id });
    })

    // DELETE ISSUE
    .delete((req, res) => {
      const { _id } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      const index = issues.findIndex(i => i._id === _id && i.project === req.params.project);

      if (index === -1) return res.json({ error: 'could not delete', _id });

      issues.splice(index, 1);

      res.json({ result: 'successfully deleted', _id });
    });

};
