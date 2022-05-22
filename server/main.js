require("dotenv").config()
const { exec } = require("child_process")
const storage = require('node-persist')
const axios = require("axios")
const { createJWT, jwtMiddleware } = require("./jwt")

const users = [
  // {
  //   email: 'tu@keva.dev',
  //   containerId: null,
  //   port: null, pwd: null,
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
    await saveDB()
  }, 1000 * 5)
}

async function saveDB() {
  await storage.setItem('db', JSON.stringify(users))
}

void init()

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
      resolve(stdout.trim())
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
  const pwd = `${Math.random().toString(36).slice(-8)}`
  const name = `keva-${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`
  const cmd = `docker run --name ${name} -m 256m -d -p ${port}:6379 kevadev/keva-server --requirepass ${pwd}`
  try {
    const containerId = await executeCommand(cmd)
    userObj.containerId = containerId
    userObj.port = port
    userObj.pwd = pwd
    return {
      pwd,
      containerId,
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
    userObj.pwd = null
    userObj.token = null
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

// Server

const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const verifyGoogleOAuth = async t => {
  const googleURL = "https://www.googleapis.com/userinfo/v2/me"
  const { data } = await axios.get(googleURL, {
    headers: { Authorization: `Bearer ${t}`, Accept: "application/json" }
  })
  return data
}

app.post('/login', async function (req, res) {
  try {
    if (req.body.token) {
      const { email } = await verifyGoogleOAuth(req.body.token)
      const token = createJWT({ email })
      return res.send({ token, email })
    }
    if (req.body.code) {
      const { data } = await axios.post('https://github.com/login/oauth/access_token', null, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: req.body.code,
        }
      })
      const { access_token } = data
      const { data: { email } } = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` }
      })
      const token = createJWT({ email })
      return res.send({ token, email })
    }
    return res.send({ error: "Invalid request" })
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.get('/creds', jwtMiddleware, async function (req, res) {
  const who = req.email
  const userObj = users.find(u => u.email === who)
  if (!userObj) {
    return res.status(200).send({})
  }
  if (!userObj.containerId) {
    return res.status(200).send({})
  }
  userObj.token = createJWT({port: userObj.port, pwd: userObj.pwd}, null, "8760h")
  return res.send(userObj)
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
  return res.send(stats[0])
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
  const who = req.email
  const userObj = users.find(u => u.email === who)
  if (!userObj) {
    return res.status(400).send({ err: 'Cannot find that email' })
  }
  if (!userObj.containerId) {
    return res.status(400).send({ err: 'Cannot find that email container' })
  }
  const containerId = userObj.containerId
  try {
    await restartKevaInstance(containerId)
    return res.send({ message: 'Done'})
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.get('/log', jwtMiddleware, async function (req, res) {
  const who = req.email
  const userObj = users.find(u => u.email === who)
  if (!userObj) {
    return res.status(400).send('Cannot find that email')
  }
  if (!userObj.containerId) {
    return res.status(400).send('Cannot find that email container')
  }
  const containerId = userObj.containerId
  try {
    const log = await getKevaInstanceLog(containerId)
    return res.send(`<title>Instance ${containerId}</title><pre>${log}</pre>`)
  } catch(err) {
    return res.status(400).send(err.message)
  }
})

app.get('/admin', async function (req, res) {
  const id = req.query.id
  if (id !== process.env.ADMIN) {
    return res.status(400).send({ message: 'You are not admin' })
  }
  users.filter(u => {
    u.accountCreateTime = Math.floor(+new Date() / 1000)
    u.instanceCreateTime = Math.floor(+new Date() / 1000)
    u.lastAccessTime = Math.floor(+new Date() / 1000)
    u.accountType = "google"
  })
  return res.send(users)
})

const port = process.env.PORT || 2222
app.listen(port, () => {
  console.log(`Keva Cloud server listening at http://localhost:${port}`)
})
