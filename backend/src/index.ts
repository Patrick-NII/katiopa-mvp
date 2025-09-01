import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import statsRoutes from './routes/stats'
import experiencesRoutes from './routes/experiences'
import settingsRoutes from './routes/settings'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/experiences', experiencesRoutes)
app.use('/api/settings', settingsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Route par défaut
app.get('/', (req, res) => {
  res.json({ 
    message: 'API KATIOPA Backend',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      stats: '/api/stats',
      experiences: '/api/experiences',
      settings: '/api/settings'
    }
  })
})

// Gestion des erreurs 404
app.use('*', (req, res) => {
  console.log('🚫 Route non trouvée:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })
  res.status(404).json({ error: 'Route non trouvée' })
})

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur KATIOPA démarré sur le port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 API: http://localhost:${PORT}/api`)
  console.log(`🔒 Sécurité: JWT=true, Cookies=true`)
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`)
})
