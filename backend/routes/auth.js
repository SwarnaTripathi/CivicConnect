const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Demo rep credentials — replace with DB lookup in production
const DEMO_REPS = [
  { id: 'rep_001', username: 'admin', password: 'admin123', ward: 'All', name: 'Admin Rep' },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const rep = DEMO_REPS.find(r => r.username === username && r.password === password);
  if (!rep) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: rep.id, username: rep.username, ward: rep.ward, name: rep.name },
    process.env.JWT_SECRET || 'supersecret_civicconnect_key',
    { expiresIn: '8h' }
  );
  res.json({ token, name: rep.name, ward: rep.ward });
});

module.exports = router;
