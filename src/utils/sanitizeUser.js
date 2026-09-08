function sanitizeUser(user) {
  if (!user) return user;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.passwordHash;
  delete plain.password;
  return plain;
}

module.exports = sanitizeUser;
