import './App.scss'

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'
import Login from './components/Login'
import NotFound from './components/NotFound'
import Main from './components/Main'

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  if (currentTheme === null) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <img src="https://i.imgur.com/z0c9bV7.png" alt="Logo" style={{ width: '75px' }}/>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/main" element={<Main/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        <div className="toggle-theme" onClick={toggleTheme}>
          Toggle theme
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
