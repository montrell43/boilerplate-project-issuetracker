'use strict';
const { ObjectId } = require('mongodb');

module.exports = function (app, db) { // pass your db connection to this module

  app.route('/api/issues/:project')

    // GET issues
    .get(async function (req, res) {
      const project = req.params.project;
      const query = { project };

      // Add filters from query params
      for (let key in req.query) {
        if (key === 'open') req.query[key] = req.query[key] === 'true';
        query[key] = req.query[key];
      }

      try {
        const issues = await db.collection('issues').find(query).toArray();
        res.json(issues);
      } catch (err) {
        res.status(500).json({ error: 'could not fetch issues' });
      }
    })

    // POST issue
    .post(async function (req, res) {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date();
      const newIssue = {
        project,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: now,
        updated_on: now,
        open: true
      };

      try {
        const result = await db.collection('issues').insertOne(newIssue);
        res.json({ ...newIssue, _id: result.insertedId });
      } catch (err) {
        res.status(500).json({ error: 'could not create issue' });
      }
    })

    // PUT update issue
    .put(async function (req, res) {
      const project = req.params.project;
      const { _id, ...fields } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      // Remove empty fields
      const updateFields = {};
      for (let key in fields) {
        if (fields[key] !== undefined && fields[key] !== '') updateFields[key] = fields[key];
      }

      if (Object.keys(updateFields).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      updateFields.updated_on = new Date();

      try {
        const result = await db.collection('issues').updateOne(
          { _id: ObjectId(_id), project },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) return res.json({ error: 'could not update', _id });
        res.json({ result: 'successfully updated', _id });
      } catch (err) {
        res.json({ error: 'could not update', _id });
      }
    })

    // DELETE issue
    .delete(async function (req, res) {
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      try {
        const result = await db.collection('issues').deleteOne({ _id: ObjectId(_id), project });
        if (result.deletedCount === 0) return res.json({ error: 'could not delete', _id });
        res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        res.json({ error: 'could not delete', _id });
      }
    });

};
