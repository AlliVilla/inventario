const jwt = require('jsonwebtoken');

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || Buffer.byteLength(value) < 32 || value === 'ferreteria_villamil_secret_key_2024') {
    throw new Error('Configure JWT_SECRET with at least 32 random bytes');
  }
  return value;
}

function signSession(id) {
  return jwt.sign({ id }, secret(), { audience: 'session', expiresIn: '1d' });
}

function verify(token, audience) {
  return jwt.verify(token, secret(), { audience, algorithms: ['HS256'] });
}

function trackingPath(id) {
  const token = jwt.sign({ id }, secret(), { audience: 'tracking', noTimestamp: true });
  return '/cliente/tracking/' + token;
}

module.exports = { secret, signSession, verify, trackingPath };
