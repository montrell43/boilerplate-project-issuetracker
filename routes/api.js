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
  const project = req.params.project;
  const { _id, ...fields } = req.body;

  // 1) missing id
  if (!_id) {
    return res.json({ error: 'missing _id' });
  }

  // Only count real, non-empty updates; coerce 'open'
  const allowed = ['issue_title','issue_text','created_by','assigned_to','status_text','open'];
  const updates = {};
  for (const key of allowed) {
    if (fields[key] !== undefined && fields[key] !== '') {
      updates[key] = key === 'open'
        ? (fields[key] === true || fields[key] === 'true')
        : fields[key];
    }
  }

  // 2) no update fields sent
  if (Object.keys(updates).length === 0) {
    return res.json({ error: 'no update field(s) sent', _id });
  }

  // 3) find issue by _id + project
  const issue = issues.find(i => i._id === _id && i.project === project);
  if (!issue) {
    return res.json({ error: 'could not update', _id });
  }

  // apply updates + timestamp
  Object.assign(issue, updates);
  issue.updated_on = new Date();

  return res.json({ result: 'successfully updated', _id });
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
