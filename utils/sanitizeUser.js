const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};
const userFields = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  email: true,
  aboutMe: true,
  createdAt: true,
  updatedAt: true,
};

module.exports = { sanitizeUser, userFields };
