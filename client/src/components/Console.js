import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from './toast'

axios.defaults.baseURL = 'https://cloud-console-api.keva.dev'

const service = axios.create()
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)

service.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 401) {
    localStorage.removeItem('email')
    localStorage.removeItem('token')
    window.location.href = '/'
  }
  return error
})

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
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    setCreateLoading(true)
    await createServerApi()
    await sleep(3000)
    setCreateLoading(false)
    loadHealth()
    await openConnectModal()
  }

  async function openConnectModal(e) {
    if (e) { e.preventDefault() }
    const data = await getCredsApi()
    setCreds(data)
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
    loadHealth()
  }

  function logout() {
    localStorage.removeItem('email')
    localStorage.removeItem('token')
    navigate('/')
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
          <option>Keva@1.0.0-rc1</option>
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
          <div>Your Keva instance is up! (<a href="#!" onClick={loadHealth}>refresh state</a>)</div>
          <div>Instance ID: {health.Name} (<a href={`https://cloud-console-api.keva.dev/log?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer">view log</a>)</div>
          <div>CPU Usage: {health.CPUPerc} (1 core vCPU)</div>
          <div>Memory Usage: {health.MemUsage} ({health.MemPerc})</div>
          <div>Network Inbound/Outbound: {health.NetIO}</div>
          <div>Plan: Free-Tier 256MB</div>
        </div>}
        {!loading && health && <div className="controls">
          <div><button className="secondary" onClick={openConnectModal}>Connect</button></div>
          <div><button className="secondary" onClick={restartServer}>Restart instance</button></div>
          <div><button disabled={loading} onClick={deleteServer}>Destroy instance</button></div>
          <div><button className="secondary" onClick={() => toast('Please contact cloud@keva.dev')}>Upgrade plan!</button></div>
        </div>}
      </div>
      <div>Account: {localStorage.getItem('email')}&nbsp;
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={logout}>(logout?)</span></div>

      {isModalOpen && <div className="popup-overlay">
        <div className="popup">
          <h1>Keva Instance's credentials</h1>
          <div>Host: run.keva.dev:{creds.port}</div>
          <div>Password: {creds.pwd}</div>
          <h1>Connect to the instance</h1>
          <div>Via <strong>redis-cli</strong>:</div>
          <div><code>redis-cli -h run.keva.dev -p {creds.port} -a {creds.pwd}</code></div>
          <div>Via <strong>REST API</strong>:</div>
          <div><code>curl https://cloud-rest-api.keva.dev/set/foo/bar -H "Authorization: Bearer {creds.token}"</code></div>
          <div>Via&nbsp;
            <a href="https://redis.io/docs/clients/" target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>Redis Clients</a>,
            also see <a href="https://keva.dev/guide/overview/commands.html" target="_blank" rel="noreferrer">Keva's Redis Compatibility</a></div>
          <div style={{ width: '100%', textAlign: 'right' }}>
            <button onClick={closeConnectModal} className="secondary" style={{ minWidth: 'unset'}}>Okay got it!</button>
          </div>
        </div>
      </div>}
    </React.Fragment>
  )
}

export default Console
