import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadSeedIfEmpty } from './data/seedLoader'

loadSeedIfEmpty()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
