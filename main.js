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
  {
    name: 'tyler',
    email: 'tu@keva.dev',
    containerId: null,
    port: null,
  },
  {
    name: 'blu',
    email: 'blu@keva.dev',
    containerId: null,
    port: null,
  }
]

async function createKevaInstance(userName) {
  const userObj = users.find(u => u.name === userName)
  if (!userObj) {
    throw new Error('Cannot find that userName')
  }
  const port = getPort()
  const randomNumber = Math.floor(1000 + Math.random() * 9000)
  const pwd = `kevapwd${randomNumber}`
  const cmd = `docker run --name keva-${userName} -d -p ${port}:6379 kevadev/keva-server --requirepass ${pwd}`
  try {
    const containerId = await executeCommand(cmd)
    userObj.containerId = containerId.trim()
    userObj.port = port
    return `${userName} has created Keva cloud instance successfully, containerId is ${containerId}, port is ${port}, password is: ${pwd}`
  } catch(err) {
    throw err
  }
}

async function removeKevaInstance(userName) {
  const userObj = users.find(u => u.name === userName)
  if (userObj) {
    await executeCommand(`docker stop ${userObj.containerId}`)
    await executeCommand(`docker rm ${userObj.containerId}`)
    return
  }
  throw new Error('Cannot find that userName')
}

async function getStats() {
  const stats = await executeCommand('sh ./stats.sh')
  const statsTrimmed = stats.trim()
  const listStats = statsTrimmed.split("\n")
  return listStats.map(l => JSON.parse(l))
}

async function main() {
  const result = await createKevaInstance('tyler')
  console.log(result)
}

void main()
