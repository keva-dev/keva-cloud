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
  const [created, setCreated] = useState(null)

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
      if (r.container) {
        setHealth(r)
      } else {
        setHealth(null)
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  async function createServer() {
    const result = await createServerApi()
    setCreated(result)
  }

  async function deleteServer(e) {
    e.preventDefault()
    const agree = window.confirm('Are you sure you want to delete your Keva instance?')
    if (!agree) {
      return
    }
    setCreated(null)
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
      <h1>Keva Cloud Console</h1>
      {loading && <div className="lds-ripple"><div></div><div></div></div>}
      {!loading && !created && !health && <React.Fragment>
        <p>You haven't spawned any Keva instance</p>
        <button onClick={createServer}>Spawn your Keva instance!</button>
      </React.Fragment>}
      {!loading && health && <React.Fragment>
        <div>Your Keva instance is up! (<a href="#!" onClick={loadHealth}>refresh state</a>)</div>
        <div>Instance ID: {health.container.substring(0, 12)} (<a href={`https://keva-cloud.tuhuynh.com/log?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer">view log</a>)</div>
        <div>CPU Usage: {health.cpu} (1 core)</div>
        <div>Memory Usage: {health.memory.raw} ({health.memory.percent})</div>
        <div><button className="secondary" onClick={restartServer} style={{ marginTop: '20px' }}>Restart instance</button></div>
        <div><button disabled={loading} onClick={deleteServer}>Destroy this instance</button></div>
        <div style={{ cursor: 'pointer' }} onClick={() => window.alert('Please contact cloud@keva.dev')}>Upgrade to Pro instance!</div>
      </React.Fragment>}
      {created && <React.Fragment>
        <div>Host: redis://run.keva.dev:{created.port}</div>
        <div>Password: {created.pwd}</div>
        <div>Please save this instance credential!</div>
        <div><button disabled={loading} onClick={() => { setCreated(null); loadHealth(); }}>Ok, I've saved it!</button></div>
        <div>Connect by redis-cli:</div>
        <div><code>redis-cli -h run.keva.dev -p {created.port} -a {created.pwd}</code></div>
        <div>Or netcat:</div>
        <div><code>nc run.keva.dev {created.port}</code></div>
      </React.Fragment>}
      <div style={{ marginTop: '20px' }}>{localStorage.getItem('email')}&nbsp;
      <span style={{ cursor: 'pointer' }} onClick={logout}>(logout?)</span></div>
    </React.Fragment>
  )
}

export default Console
