import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadSeedIfEmpty } from './data/seedLoader'
import { loadLocationsSeedIfEmpty } from './data/locationsSeedLoader'
import { loadNpcSeedIfEmpty } from './data/npcSeedLoader'

loadSeedIfEmpty()
loadLocationsSeedIfEmpty()
loadNpcSeedIfEmpty()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
