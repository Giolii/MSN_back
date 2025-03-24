const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { sanitizeUser } = require("../utils/sanitizeUser");

const prisma = require("./prisma");

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: jwt_payload.id,
        },
      });
      if (user) {
        return done(null, sanitizeUser(user));
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = { passport };
