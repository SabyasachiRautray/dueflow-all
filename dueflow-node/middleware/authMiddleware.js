const jwt = require('jsonwebtoken');

module.exports = async function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication token is required' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT_SECRET is not configured' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id ?? payload.userId ?? payload.sub;
    if (!userId) return res.status(401).json({ error: 'Token does not identify a user' });
    const user = await req.app.locals.db.User.findByPk(userId, { attributes: ['id', 'org_id', 'role'] });
    if (!user) return res.status(401).json({ error: 'User account was not found' });
    req.user = { ...payload, id: user.id, org_id: user.org_id, role: user.role };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};
