require("dotenv").config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { createClient } = require('redis')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const { verifyJWT } = require("./jwt")

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

    const { port, pwd } = payload
    req.port = port
    req.pwd = pwd

    next()
  } catch (err) {
    res.status(401)
    res.send({ message: "Unauthorized", error: err })
  }
}

app.use(jwtMiddleware, async (req, res, next) => {
  const args = req.path.split("/").filter(Boolean)
  try {
    const client = createClient({
      url: `redis://${req.pwd}@run.keva.dev:${req.port}`
    })
    await client.connect()
    const result = await client[args[0]](...args.slice(1))
    await client.quit()
    res.send({ result })
  } catch (err) {
    res.status(400)
    res.send({ error: err })
  }
})

const port = process.env.PORT || 2223
app.listen(port, () => {
  console.log(`Keva REST Proxy server listening at http://localhost:${port}`)
})
