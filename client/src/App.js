import { useState } from 'react'
import './App.scss'

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'
import Login from './components/Login'
import NotFound from './components/NotFound'
import Console from './components/Console'

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  if (currentTheme === null) {
    setTheme('light')
  } else if (currentTheme === 'dark') {
    setTheme('light')
  } else {
    setTheme('dark')
  }
}

function initTheme() {
  const theme = localStorage.getItem('theme')
  if (!theme) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  } else {
    setTheme(theme)
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newTheme = e.matches ? 'dark' : 'light'
    setTheme(newTheme)
  })
}

initTheme()

function App() {
  const [themeState, setThemeState] = useState(localStorage.getItem('theme'))

  function toggleThemeHandler() {
    if (themeState === 'dark') {
      setThemeState('light')
    } else {
      setThemeState('dark')
    }
    toggleTheme()
  }

  return (
    <BrowserRouter>
      <div className="app">
        <a href="https://keva.dev" target="_blank" rel="noreferrer">
          <img src="https://avatars.githubusercontent.com/u/91342451?s=200&v=4" alt="Logo"
               className="rotating"
               style={{ width: '100px', borderRadius: '50%' }}/>
        </a>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/console" element={<Console/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        <button className="toggle-theme secondary" onClick={toggleThemeHandler}>
          Switch to {themeState === 'dark' ? 'light' : 'dark'} mode
        </button>
      </div>
    </BrowserRouter>
  )
}

export default App
