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

import DarkSvg from './Dark.svg'
import SunSvg from './Sun.svg'

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

const lightLogo = 'https://i.imgur.com/oePAIgz.jpg'
const darkLogo = 'https://i.imgur.com/PZ2zx1o.jpg'

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
          <img src={themeState === 'dark' ? lightLogo : darkLogo} alt="Logo"
               className="rotating"
               style={{ width: '125px', borderRadius: '50%' }}/>
        </a>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/console" element={<Console/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        <img src={themeState === 'dark' ? SunSvg : DarkSvg} className="toggle-theme" alt="Toggle theme" onClick={toggleThemeHandler} />
      </div>
    </BrowserRouter>
  )
}

export default App
