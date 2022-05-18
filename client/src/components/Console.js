import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

axios.defaults.baseURL = 'https://keva-cloud.tuhuynh.com'

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
    await createServerApi()
    loadHealth()
    openConnectModal()
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

  const hasTryFlag = localStorage.getItem('try')

  return (
    <React.Fragment>
      <h1>Keva Cloud Console</h1>
      {loading && <div className="lds-ripple"><div></div><div></div></div>}
      {!loading && !health && <React.Fragment>
        <p>You haven't spawned any Keva instance</p>
        <button onClick={createServer}>Spawn your Keva instance!</button>
      </React.Fragment>}
      {!loading && health && <React.Fragment>
        <div>Your Keva instance is up! (<a href="#!" onClick={loadHealth}>refresh state</a>)</div>
        <div>Instance ID: {health.ID} (<a href={`https://keva-cloud.tuhuynh.com/log?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer">view log</a>)</div>
        <div>CPU Usage: {health.CPUPerc} (1 core)</div>
        <div>Memory Usage: {health.MemUsage} ({health.MemPerc})</div>
        <div>Network Usage: {health.NetIO}</div>
      </React.Fragment>}
      {health && <React.Fragment>
        <div><button className="secondary" onClick={openConnectModal} style={{ marginTop: '20px' }}>Connect</button></div>
        <div><button className="secondary" onClick={restartServer}>Restart instance</button></div>
        <div><button disabled={loading} onClick={deleteServer}>Destroy this instance</button></div>
        {!hasTryFlag && <div style={{ cursor: 'pointer' }} onClick={() => window.alert('Please contact cloud@keva.dev')}>Upgrade to Pro instance!</div>}
      </React.Fragment>}
      <div style={{ marginTop: '20px' }}>{localStorage.getItem('email')}&nbsp;
      <span style={{ cursor: 'pointer' }} onClick={logout}>(logout?)</span></div>

      {isModalOpen && <div className="popup-overlay">
        <div className="popup">
          <h2>Instance's credential</h2>
          <div>Host: redis://run.keva.dev:{creds.port}</div>
          <div>Password: {creds.pwd}</div>
          <h2>Connect to the instance</h2>
          <div>Via <strong>redis-cli</strong>:</div>
          <div><code>redis-cli -h run.keva.dev -p {creds.port} -a {creds.pwd}</code></div>
          <div>Via <strong>netcat</strong>:</div>
          <div><code>nc run.keva.dev {creds.port}</code></div>
          <div>Via <strong>REST API</strong>:</div>
          <div><code>curl https://restapi.keva.dev/set/foo/bar -H "Authorization: Bearer {creds.token}"</code></div>
          <div>Via <a href="https://redis.io/docs/clients/" target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>Redis Client</a></div>
          <div style={{ width: '100%', textAlign: 'right' }}><button onClick={closeConnectModal}>Okay!</button></div>
        </div>
      </div>}
    </React.Fragment>
  )
}

export default Console
