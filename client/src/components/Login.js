import React from 'react'
import { useNavigate } from 'react-router-dom'
import GoogleLogin from 'react-google-login'

function Login() {
  const navigate = useNavigate()

  function onLogin({ email }) {
    localStorage.setItem('email', email)
    navigate('/main')
  }

  function responseGoogle(data) {
    console.log(data)
    if (data.error) return
    if (!data || !data.profileObj.email || !data.accessToken) return
    onLogin({ email: data.profileObj.email })
  }

  return (
    <React.Fragment>
      <h1>Try Keva Cloud!</h1>
      <p>Spawn your Keva instance in seconds!</p>
      <div className="login-box" onSubmit={onLogin}>
        <GoogleLogin
          clientId="834798810236-piematcse01o0nt70l67omb17mbqt02m.apps.googleusercontent.com"
          render={renderProps => (
            <button type="button" onClick={renderProps.onClick}>Login with Google account</button>
          )}
          buttonText="Login with Google"
          onSuccess={responseGoogle}
          onFailure={responseGoogle}
        />
      </div>
      <p className="notice">*Free 1 Keva instance per account with 256MB memory</p>
    </React.Fragment>
  )
}

export default Login
