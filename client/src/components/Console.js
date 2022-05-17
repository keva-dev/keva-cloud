import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

async function getHealthApi() {
  const { data } = await axios.get(`https://keva-cloud.tuhuynh.com/health?who=${localStorage.getItem('email')}`)
  return data
}

async function createServerApi() {
  const { data } = await axios.post(`https://keva-cloud.tuhuynh.com/create?who=${localStorage.getItem('email')}`)
  return data
}

async function deleteServerApi() {
  const agree = window.confirm('Are you sure you want to delete your Keva instance?')
  if (!agree) {
    return
  }
  const { data } = await axios.delete(`https://keva-cloud.tuhuynh.com/delete?who=${localStorage.getItem('email')}`)
  return data
}

function Console() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('email')) {
      navigate('/')
    }
  }, [])

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

  async function deleteServer() {
    setCreated(null)
    await deleteServerApi()
    loadHealth()
  }

  function logout() {
    const agree = window.confirm('Are you sure you want to logout?')
    if (!agree) {
      return
    }
    localStorage.removeItem('email')
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
        <div>Your Keva instance is up!</div>
        <div>Container ID: {health.container}</div>
        <div>CPU Usage: {health.cpu} (1 core)</div>
        <div>Memory Usage: {health.memory.raw} ({health.memory.percent})</div>
        <div><button className="secondary" onClick={loadHealth} style={{ marginTop: '20px' }}>Refresh health</button></div>
        <div><a href={`https://keva-cloud.tuhuynh.com/log?id=${health.container}`} target="_blank" rel="noreferrer">
          <button className="secondary">View logs</button>
          </a></div>
        <div><button disabled={loading} onClick={deleteServer}>Destroy this instance</button></div>
        <div style={{ cursor: 'pointer' }} onClick={() => window.alert('Please contact cloud@keva.dev')}>Upgrade to Pro instance</div>
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
      <div style={{ marginTop: '20px' }}>Logged in as {localStorage.getItem('email')}&nbsp;
      <span style={{ cursor: 'pointer' }} onClick={logout}>(logout?)</span></div>
    </React.Fragment>
  )
}

export default Console
