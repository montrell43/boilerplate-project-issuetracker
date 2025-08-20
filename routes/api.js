const issues = [];
let idCounter = 1;

module.exports = function(app) {

  app.route('/api/issues/:project')
    .get((req, res) => {
  let filtered = issues.filter(issue => issue.project === req.params.project);

  // Apply query filters
  for (let key in req.query) {
    let value = req.query[key];
    
    // Convert "open" from string to boolean
    if (key === 'open') value = value === 'true';

    filtered = filtered.filter(issue => issue[key] == value);
  }

  res.json(filtered);
})
  .post((req, res) => {
      const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;
      if (!issue_title || !issue_text || !created_by) return res.json({ error: 'required field(s) missing' });
      const newIssue = {
        _id: (idCounter++).toString(),
        project: req.params.project,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };
      issues.push(newIssue);
      res.json(newIssue);
    })
    .put((req, res) => {
  const { _id, ...fields } = req.body;
  if (!_id) return res.json({ error: 'missing _id' });

  const issue = issues.find(i => i._id === _id && i.project === req.params.project);
  if (!issue) return res.json({ error: 'could not update', _id });

  // Filter only fields with actual values
  const updates = Object.keys(fields).filter(k => fields[k] !== undefined && fields[k] !== '');

  if (updates.length === 0) {
    return res.json({ error: 'no update field(s) sent', _id });
  }

  // Apply updates
  updates.forEach(key => issue[key] = fields[key]);
  issue.updated_on = new Date();
  res.json({ result: 'successfully updated', _id });
})
.delete((req, res) => {
      const { _id } = req.body;
      if (!_id) return res.json({ error: 'missing _id' });
      const index = issues.findIndex(i => i._id === _id && i.project === req.params.project);
      if (index === -1) return res.json({ error: 'could not delete', _id });
      issues.splice(index, 1);
      res.json({ result: 'successfully deleted', _id });
    });
};
