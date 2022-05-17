import './App.scss'

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from 'react-router-dom'
import Login from './components/Login'
import NotFound from './components/NotFound'
import Main from './components/Main'

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
  return (
    <BrowserRouter>
      <div className="app">
        <Link to="/"><img src="https://i.imgur.com/z0c9bV7.png" alt="Logo" style={{ width: '75px' }}/></Link>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/main" element={<Main/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        <button className="toggle-theme secondary" onClick={toggleTheme}>
          Toggle theme
        </button>
      </div>
    </BrowserRouter>
  )
}

export default App
