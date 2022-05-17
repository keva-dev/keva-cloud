require("dotenv").config()
const { exec } = require("child_process")

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

const users = [
  // {
  //   email: 'tu@keva.dev',
  //   containerId: null,
  //   port: null,
  // },
  // {
  //   email: 'blu@keva.dev',
  //   containerId: null,
  //   port: null,
  // }
]

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

async function getStats() {
  const stats = await executeCommand('sh ./stats.sh')
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

app.get('/health', async function (req, res) {
  const who = req.query.who
  const userObj = users.find(u => u.email === who)
  if (!userObj || !userObj.containerId) {
    return res.status(200).send({})
  }
  const stats = await getStats()
  if (!userObj.containerId) {
    return res.status(200).send({})
  }
  const r = stats.find(s => userObj.containerId.startsWith(s.container))
  return res.send(r)
})

app.post('/create', async function (req, res) {
  const who = req.query.who
  try {
    const result = await createKevaInstance(who)
    return res.send(result)
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.delete('/delete', async function (req, res) {
  const who = req.query.who
  try {
    await removeKevaInstance(who)
    return res.send({ message: 'Done'})
  } catch(err) {
    return res.status(400).send({ err: err.message })
  }
})

app.put('/restart', async function (req, res) {
  const id = req.query.id
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
