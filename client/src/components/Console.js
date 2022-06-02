import React, { useState, useEffect } from 'react'

import { service } from './axios'
import { useNavigate } from 'react-router-dom'
import { toast } from './toast'
import Tabs from './Tabs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function getHealthApi() {
  const { data } = await service.get(`/health`)
  return data
}

async function getCredsApi() {
  const { data } = await service.get(`/creds`)
  return data
}

async function createServerApi() {
  const { data } = await service.post(`/create`)
  return data
}

async function deleteServerApi() {
  const { data } = await service.delete(`/delete`)
  return data
}

async function restartServerApi() {
  const { data } = await service.put(`/restart`)
  return data
}

function Console() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [creds, setCreds] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    loadHealth()
  }, [])

  useEffect(() => {
    void getCreds()
  }, [])

  function loadHealth() {
    setLoading(true)
    getHealthApi().then(r => {
      if (r.Container) {
        setHealth(r)
      } else {
        setHealth(null)
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  async function createServer() {
    setCreateLoading(true)
    await createServerApi()
    await sleep(3000)
    setCreateLoading(false)
    loadHealth()
    await openConnectModal()
  }

  async function getCreds() {
    const data = await getCredsApi()
    setCreds(data)
  }

  async function openConnectModal(e) {
    if (e) { e.preventDefault() }
    await getCreds()
    setIsModalOpen(true)
  }

  function closeConnectModal(e) {
    e.preventDefault()
    setIsModalOpen(false)
  }

  async function deleteServer(e) {
    e.preventDefault()
    const agree = window.confirm('Are you sure you want to delete your Keva instance?')
    if (!agree) {
      return
    }
    await deleteServerApi()
    loadHealth()
  }

  async function restartServer(e) {
    e.preventDefault()
    const agree = window.confirm('Are you sure you want to restart your Keva instance?')
    if (!agree) {
      return
    }
    await restartServerApi()
    await sleep(1500)
    loadHealth()
  }

  function logout() {
    localStorage.removeItem('email')
    localStorage.removeItem('token')
    navigate('/')
  }

  async function upgrade() {
    // toast('Please contact cloud@keva.dev')
    const code = window.prompt('Please enter the upgrade code')
    if (!code) {
      return
    }
    try {
      const resp = await service.post('/upgrade', { code: code.toUpperCase() })
      if (resp.data && resp.data.message) {
        toast(resp.data.message)
        loadHealth()
        await getCreds()
      } else if (resp.response.data.err) {
        toast(resp.response.data.err)
      }
    } catch (e) {
      toast('An error occurred')
    }
  }

  return (
    <React.Fragment>
      <h1>Cloud Console</h1>
      {!loading && !health && <React.Fragment>
        <p>You haven't spawned any Keva instance</p>
        <button onClick={createServer} style={{ fontSize: '16px' }} className={createLoading ? 'loading' : ''}>
          Spawn a Keva instance!
        </button>
        <p>Version <select disabled={createLoading}>
          <option>Keva@latest</option>
          <option>Keva@1.0.0-rc2</option>
          <option disabled>Keva@1.0.0-rc1</option>
          <option disabled>Keva@1.0.0-rc0</option>
        </select></p>
        <p>Region <select disabled={createLoading}>
          <option disabled>Tokyo, Japan</option>
          <option>Singapore</option>
        </select></p>
        <p>Strong Consistency*: <select disabled={createLoading}>
          <option disabled>Enabled</option>
          <option>Disabled</option>
        </select></p>
        <p className="notice" style={{ maxWidth: '350px' }}>
          *When strong consistency is enabled, persistence to disk are performed before returning response to the client</p>
      </React.Fragment>}
      <div className="console">
        {loading && <div className="lds-ripple"><div/><div/></div>}
        {!loading && health && <div className="metadata">
          <div>Your Keva instance is up, {creds && <span>
            {dayjs(dayjs.unix(creds.instanceCreateTime)).fromNow()}
          </span>}</div>
          <div>Instance ID: {health.Name} (<a href={`https://cloud-console-api.keva.dev/log?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer">log</a>)</div>
          <div>CPU Usage: {health.CPUPerc} (<a href="#!" onClick={loadHealth}>refresh</a>)</div>
          <div>Memory Usage: {health.MemUsage} ({health.MemPerc})</div>
          <div>Network Inbound/Outbound: {health.NetIO}</div>
          <div>Plan: {(!creds || !creds.plan) && 'Free-Tier 256MB'} {creds && creds.plan}</div>
        </div>}
        {!loading && health && <div className="controls">
          <div><button className="secondary" onClick={openConnectModal}>Connect</button></div>
          <div><button className="secondary" onClick={restartServer}>Restart instance</button></div>
          <div><button disabled={loading} onClick={deleteServer}>Destroy instance</button></div>
          {(!creds || !creds.plan) && <div><button className="secondary" onClick={upgrade}>Upgrade plan!</button></div>}
          {creds.plan && <div><a href="mailto:cloud@keva.dev" target="_blank" rel="noreferrer">
            <button className="secondary">Support</button></a></div>}
        </div>}
      </div>
      <div>Account: {creds ? `(${creds.accountType})` : '(google)' } {localStorage.getItem('email')}&nbsp;
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={logout}>(logout?)</span></div>
      {creds && creds.lastLoginTime &&
      <div>Last login: {dayjs(dayjs.unix(creds.lastLoginTime)).fromNow()} from {creds.lastLoginIP}</div>}

      {isModalOpen && <div className="popup-overlay">
        <div className="popup">
          <h2>Keva Instance's credentials</h2>
          <div>Region: Singapore</div>
          <div>Endpoint: run.keva.dev</div>
          <div>Password: {creds.pwd}</div>
          <div>Port: {creds.port}</div>
          <h2>Connect to the instance</h2>
          <Tabs tabs={
            [
              {
                name: 'redis-cli',
                content: <React.Fragment>
                  <div className="code"><code>redis-cli -u redis://{creds.pwd}@run.keva.dev:{creds.port}</code></div>
                  <div>If need TLS, you should use <a href="https://www.stunnel.org/" target="_blank" rel="noreferrer">Stunnel</a>&nbsp;
                    to establish a secure connection</div>
                </React.Fragment>,
              },
              {
                name: 'Node',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/luin/ioredis" target="_blank" rel="noreferrer">ioredis</a></div>
                  <div className="code">
                    <code>
                      {`const Redis = require("ioredis");

const client = new Redis("redis://:${creds.pwd}@run.keva.dev:${creds.port}");
client.set('foo', 'bar');`}
                    </code>
                  </div>
                </React.Fragment>
              },
              {
                name: 'Python',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/andymccurdy/" target="_blank" rel="noreferrer">redis-py</a></div>
                  <div className="code">
                    <code>
                      {`import redis

r = redis.Redis(
  host= 'run.keva.dev',
  port= '${creds.port}',
  password= '${creds.pwd})

r.set('foo','bar')
print(r.get('foo'))`}
                    </code>
                  </div>
                </React.Fragment>
              },
              {
                name: 'Ruby',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/redis/redis-rb" target="_blank" rel="noreferrer">redis-rb</a></div>
                  <div className="code">
                    <code>
                      {`require "redis"

redis = Redis.new(url: "redis://:${creds.pwd}@run.keva.dev:${creds.port}")

redis.set("foo", "bar")
puts redis.get("foo")`}
                    </code>
                  </div>
                </React.Fragment>
              },
              {
                name: 'Java',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/redis/jedis" target="_blank" rel="noreferrer">Jedis</a></div>
                  <div className="code">
                    <code>
                      {`public static void main(String[] args) {
    Jedis jedis = new Jedis("run.keva.dev", ${creds.port});
    jedis.auth("${creds.pwd}");

    jedis.set("foo", "bar");
    String value = jedis.get("foo");
}`}
                    </code>
                  </div>
                </React.Fragment>
              },
              {
                name: 'Go',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/go-redis/redis" target="_blank" rel="noreferrer">go-redis</a></div>
                  <div className="code">
                    <code>
                      {`var ctx = context.Background()

func main() {
  opt, _ := redis.ParseURL("redis://:${creds.pwd}@run.keva.dev:${creds.port}")
  client := redis.NewClient(opt)

  client.Set(ctx, "foo", "bar", 0)
  val := client.Get(ctx, "foo").Val()
  print(val)
}`}
                    </code>
                  </div>
                </React.Fragment>
              },
              {
                name: 'Docker',
                content: <React.Fragment>
                  <div>Library: <a href="https://github.com/go-redis/redis" target="_blank" rel="noreferrer">go-redis</a></div>
                  <div className="code">
                    <code>
                      {`docker run -it redis:alpine redis-cli -u redis://${creds.pwd}@run.keva.dev:${creds.port}`}
                    </code>
                  </div>
                </React.Fragment>
              },
            ]
          }/>
          <div>Also see <a href="https://keva.dev/docs/basics/compatibility" target="_blank" rel="noreferrer">Keva's Redis Compatibility</a></div>
          <h2>REST API</h2>
          <div>REST API enables you to access your Keva Cloud instance using REST</div>
          <Tabs
            tabs={[
              {
                name: 'cURL',
                content: <div className="code">
                  <code>curl https://cloud-rest-api.keva.dev/set/foo/bar -H "Authorization: Bearer {creds.token}"</code>
                </div>
              },
              {
                name: 'JavaScript (fetch)',
                content: <div className="code">
                  <code>
                    {`fetch("https://cloud-rest-api.keva.dev/set/foo/bar", {
  headers: {
    Authorization: "Bearer ${creds.token}"
  }
}).then(response => response.json())
  .then(data => console.log(data));`}
                  </code>
                </div>
              },
              {
                name: '@upstash/redis',
                content: <div className="code">
                  <code>
                    {`import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: 'https://cloud-rest-api.keva.dev',
  token: '${creds.token}',
})
   
const data = await redis.get('key');`}
                  </code>
                </div>
              }
            ]}
          />
          <div style={{ width: '100%', textAlign: 'right' }}>
            <button onClick={closeConnectModal} className="secondary" style={{ minWidth: 'unset'}}>Okay got it!</button>
          </div>
        </div>
      </div>}
    </React.Fragment>
  )
}

export default Console
