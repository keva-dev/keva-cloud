import React, { Component } from 'react'

import PopupWindow from './PopupWindow'
import { toQuery } from './githubUtils'
import GithubSvg from './Github.svg'

class GitHubLogin extends Component {
  static defaultProps = {
    buttonText: 'Log in with GitHub',
    redirectUri: '',
    scope: 'user:email',
    onRequest: () => {},
    onSuccess: () => {},
    onFailure: () => {},
  }

  onBtnClick = () => {
    const { clientId, scope, redirectUri } = this.props
    const search = toQuery({
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
    })
    const popup = this.popup = PopupWindow.open(
      'github-oauth-authorize',
      `https://github.com/login/oauth/authorize?${search}`,
      { height: 1000, width: 600 }
    )

    this.onRequest()
    popup.then(
      data => this.onSuccess(data),
      error => this.onFailure(error)
    )
  }

  onRequest = () => {
    this.props.onRequest()
  }

  onSuccess = (data) => {
    if (!data.code) {
      return this.onFailure(new Error('\'code\' not found'))
    }

    this.props.onSuccess(data)
  }

  onFailure = (error) => {
    this.props.onFailure(error)
  }

  render() {
    const { className, buttonText, children, style } = this.props
    const attrs = { onClick: this.onBtnClick, style }

    if (className) {
      attrs.className = className
    }

    return <button {...attrs}>
      <img src={GithubSvg} alt="Google"/>
      { children || buttonText }
    </button>
  }
}

export default GitHubLogin
