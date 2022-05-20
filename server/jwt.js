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

const jwtMiddleware = (req, res, next) => {
  const getToken = req =>
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
      ? req.headers.authorization.split(" ")[1]
      : req.query && req.query.token
        ? req.query.token
        : null

  try {
    const token = getToken(req)
    const payload = verifyJWT(token)

    const { email } = payload
    req.email = email

    next()
  } catch (err) {
    res.status(401)
    res.send({ message: "Unauthorized", error: err })
  }
}

module.exports = {
  createJWT,
  verifyJWT,
  jwtMiddleware
}
