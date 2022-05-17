require("dotenv").config()
const { exec } = require("child_process")
const storage = require('node-persist')
const jwt = require("jsonwebtoken")
const axios = require("axios")
const secret = process.env.JWT_SECRET || "DEFAULT_SECRET";

const users = [
  // {
  //   email: 'tu@keva.dev',
  //   containerId: null,
  //   port: null,
  // },
]

async function init() {
  await storage.init()
  const got = await storage.getItem('db')
  if (got) {
    const gotObj = JSON.parse(got)
    users.push(...gotObj)
  }

  setInterval(async () => {
    saveDB()
  }, 1000 * 5);
}

async function saveDB() {
  await storage.setItem('db', JSON.stringify(users))
}

init()

async function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(error.message))
        return
      }
      if (stderr) {
        reject(new Error(stderr))
        return
      }
      resolve(stdout)
    })
  })
}

function getPort() {
  const val = Math.floor(1000 + Math.random() * 9000)
  const isUsed = users.find(u => u.port === val)
  if (isUsed) {
    return getPort()
  }
  return val
}

function selectUser(email) {
  const userObj = users.find(u => u.email === email)
  if (!userObj) {
    users.push({ email })
    return selectUser(email)
  }
  return userObj
}

async function createKevaInstance(email) {
  const userObj = selectUser(email)
  if (userObj.containerId) {
    throw new Error("This user already created server")
  }
  const port = getPort()
  const pwd = `kevapwd${Math.floor(1000 + Math.random() * 9000)}`
  const name = `keva-${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`
  const cmd = `docker run --name ${name} -m 256m -d -p ${port}:6379 kevadev/keva-server --requirepass ${pwd}`
  try {
    const containerId = await executeCommand(cmd)
    userObj.containerId = containerId.trim()
    userObj.port = port
    return {
      pwd,
      containerId: containerId.trim(),
      port,
    }
  } catch(err) {
    throw err
  }
}

async function removeKevaInstance(email) {
  const userObj = users.find(u => u.email === email)
  if (userObj) {
    await executeCommand(`docker stop ${userObj.containerId}`)
    await executeCommand(`docker rm ${userObj.containerId}`)
    userObj.containerId = null
    userObj.port = null
    return
  }
  throw new Error('Cannot find that email')
}

async function restartKevaInstance(containerId) {
  await executeCommand(`docker restart ${containerId}`)
}

async function getKevaInstanceLog(containerId) {
  const rawLog = await executeCommand(`docker logs ${containerId}`)
  return rawLog.trim()
}

async function getStats(containerId) {
  const stats = await executeCommand(`sh ./stats.sh ${containerId}`)
  const statsTrimmed = stats.trim()
  const listStats = statsTrimmed.split("\n")
  return listStats.map(l => JSON.parse(l))
}

const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const jwtMiddleware = (req, res, next) => {
  const getToken = req =>
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
      ? req.headers.authorization.split(" ")[1]
      : req.query && req.query.token
      ? req.query.token
      : null

  const verifyJWT = token => jwt.verify(token, secret)

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
};

app.post('/login', async function (req, res) {
  const verifyGoogleOAuth = async t => {
    const googleURL = "https://www.googleapis.com/userinfo/v2/me"
    const { data } = await axios.get(googleURL, {
      headers: { Authorization: `Bearer ${t}`, Accept: "application/json" }
    })
    return data
  }
  const createJWT = (identify, obj) =>
    jwt.sign(
      {
        ...identify,
        ...obj
      },
      secret,
      { expiresIn: "24h" }
    )
  try {
    const { email } = await verifyGoogleOAuth(req.body.token);
    const token = createJWT({ email })
    return res.send({ token, email })
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.get('/health', jwtMiddleware, async function (req, res) {
  const who = req.email
  const userObj = users.find(u => u.email === who)
  if (!userObj) {
    return res.status(200).send({})
  }
  if (!userObj.containerId) {
    return res.status(200).send({})
  }
  const stats = await getStats(userObj.containerId)
  if (!stats.length) {
    return res.status(200).send({})
  }
  return res.send(r[0])
})

app.post('/create', jwtMiddleware, async function (req, res) {
  const who = req.email
  try {
    const result = await createKevaInstance(who)
    return res.send(result)
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.delete('/delete', jwtMiddleware, async function (req, res) {
  const who = req.email
  try {
    await removeKevaInstance(who)
    return res.send({ message: 'Done'})
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.put('/restart', jwtMiddleware, async function (req, res) {
  const id = req.email
  try {
    await restartKevaInstance(id)
    return res.send({ message: 'Done'})
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.get('/log', async function (req, res) {
  const id = req.query.id
  try {
    const log = await getKevaInstanceLog(id)
    return res.send(`<title>Log for container ${id}</title><pre>${log}</pre>`)
  } catch(err) {
    return res.status(400).send(err.message)
  }
})

app.get('/users', async function (req, res) {
  const id = req.query.id
  if (id !== process.env.ADMIN) {
    return res.status(400).send({ message: 'You are not admin' })
  }
  return res.send(users)
})

const port = process.env.PORT || 2222
app.listen(port, () => {
  console.log(`Keva Cloud server listening at http://localhost:${port}`)
})
