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

app.use(jwtMiddleware, async (req, res) => {
  try {
    const argsFromPath = req.path.split("/").filter(Boolean)
    const argsFromBody = req.body ? req.body : []
    const args = argsFromPath.length > 0 ? argsFromPath : argsFromBody
    if (args.length === 0) {
      res.status(400)
      res.send({ message: "Bad request" })
      return
    }
    const unsupportedCommands = ['subscribe', 'unsubscribe', 'multi', 'exec', 'discard', 'watch']
    if (unsupportedCommands.includes(args[0].toLowerCase())) {
      res.status(501)
      res.send({ error: `ERR Command is not allowed in REST: "${args[0].toUpperCase()}"` })
      return
    }
    const client = createClient({
      url: `redis://:${req.pwd}@run.keva.dev:${req.port}`
    })
    await client.connect()
    const result = await client.sendCommand(args)
    await client.quit()
    res.send({ result })
  } catch (err) {
    res.status(400)
    res.send({ error: err.message })
  }
})

const port = process.env.PORT || 2223
app.listen(port, () => {
  console.log(`Keva REST Proxy server listening at http://localhost:${port}`)
})
