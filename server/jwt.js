const secret = process.env.JWT_SECRET || "DEFAULT_SECRET"
const jwt = require('jsonwebtoken')

const createJWT = (identify, obj, expireTime = "24h") =>
  jwt.sign(
    {
      ...identify,
      ...obj
    },
    secret,
    { expiresIn: expireTime }
  )

const verifyJWT = token => jwt.verify(token, secret)

module.exports = {
  createJWT,
  verifyJWT,
}
