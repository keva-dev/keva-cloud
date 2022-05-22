import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GoogleLogin from 'react-google-login'
import GoogleSvg from './Google.svg'
import axios from 'axios'

axios.defaults.baseURL = 'https://cloud-console-api.keva.dev'

function init() {
  const hasTryFlag = window.location.href.includes("try")
  if (hasTryFlag) {
    localStorage.setItem('try', 'true')
  }
}

init()

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/console')
    }
  }, [navigate])

  async function onLogin({ token }) {
    setLoading(true)
    await sleep(500)
    const { data } = await axios.post('/login', { token })
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', data.email)
    setLoading(false)
    navigate('/console')
  }

  function responseGoogle(data) {
    if (data.error) return
    if (!data || !data.profileObj.email || !data.accessToken) return
    void onLogin({ token: data.accessToken })
  }

  const hasTryFlag = localStorage.getItem('try')

  return (
    <React.Fragment>
      <h1>Try Keva Cloud!</h1>
      <p>Spawn your Keva instance in <strong>2 seconds</strong>!</p>
      <div className="login-box" onSubmit={onLogin}>
        <GoogleLogin
          clientId="834798810236-mo101qd4s238ajssl05n4j4t9i2r4ch5.apps.googleusercontent.com"
          render={renderProps => (
            <button type="button" className={loading ? 'loading' : ''}
                    onClick={renderProps.onClick} style={{ fontSize: '1.25rem', padding: '15px 0' }}>
              <img src={GoogleSvg} alt="Google"/>
              Login with Google
            </button>
          )}
          onSuccess={responseGoogle}
          onFailure={responseGoogle}
        />
      </div>
      <p className="notice">Keva Cloud is a powerful, fully-managed <a href="https://keva.dev/guide/overview/commands.html" target="_blank" rel="noreferrer">Redis alternative</a></p>
      <p className="notice"><strong>Free 1 Keva instance with 256MB memory per account</strong></p>
      {!hasTryFlag && <p className="notice">Upgrade to pro instance (1GB+ memory) starting 5$/month</p>}
    </React.Fragment>
  )
}

export default Login
