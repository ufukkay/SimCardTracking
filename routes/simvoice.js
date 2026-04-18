const express = require('express');
const router = express.Router();
const { authMiddleware, canView, canEdit } = require('../middleware/auth');
const SimService = require('../services/simService');

const simService = new SimService('VOICE', 'sim_voice', [
  'iccid', 'phone_no', 'operator', 'status', 'assigned_to', 
  'first_name', 'last_name', 'department', 'assigned_company', 'notes', 'package_id'
]);

router.use(authMiddleware);

router.get('/', canView('voice'), (req, res) => {
  try { res.json(simService.getAll(req.query)); } 
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', canView('voice'), (req, res) => {
  const row = simService.getById(req.params.id);
  if (!row) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json(row);
});

router.post('/', canEdit('voice'), (req, res) => {
  try {
    const result = simService.create(req, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', canEdit('voice'), (req, res) => {
  try {
    res.json(simService.update(req, req.params.id, req.body));
  } catch (err) {
    if (err.message === 'Kayıt bulunamadı.') return res.status(404).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', canEdit('voice'), (req, res) => {
  try {
    res.json(simService.remove(req, req.params.id));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

router.post('/bulk-delete', canEdit('voice'), (req, res) => {
  try {
    res.json(simService.bulkRemove(req, req.body.ids));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/bulk-update', canEdit('voice'), (req, res) => {
  try {
    res.json(simService.bulkUpdate(req, req.body.ids, req.body.data));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
