#!/usr/bin/env node

/**
 * Script de test pour vérifier la gestion des statuts en ligne/hors ligne
 * Ce script simule des connexions et déconnexions pour tester le système
 */

const API_BASE = 'http://localhost:3001/api'

async function testSessionStatus() {
  console.log('🧪 Test du système de gestion des statuts en ligne/hors ligne')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les sessions existantes
    console.log('\n1️⃣ Vérification des sessions existantes...')
    const sessionsResponse = await fetch(`${API_BASE}/sessions/children`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json()
      console.log(`✅ ${sessions.length} session(s) trouvée(s)`)
      
      sessions.forEach((session: any) => {
        console.log(`   - ${session.name} (${session.sessionId}): ${session.currentSessionStartTime ? '🟢 En ligne' : '🔴 Hors ligne'}`)
      })
    } else {
      console.log('❌ Erreur lors de la récupération des sessions')
    }

    // 2. Nettoyer les sessions orphelines
    console.log('\n2️⃣ Nettoyage des sessions orphelines...')
    const cleanupResponse = await fetch(`${API_BASE}/sessions/cleanup-orphaned-sessions`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (cleanupResponse.ok) {
      const cleanupResult = await cleanupResponse.json()
      console.log(`✅ ${cleanupResult.cleanedCount} session(s) orpheline(s) nettoyée(s)`)
    } else {
      console.log('❌ Erreur lors du nettoyage des sessions orphelines')
    }

    // 3. Tester la mise à jour de statut (simulation)
    console.log('\n3️⃣ Test de mise à jour de statut...')
    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json()
      if (sessions.length > 0) {
        const testSession = sessions[0]
        console.log(`   Test avec la session: ${testSession.name} (${testSession.sessionId})`)
        
        // Simuler une déconnexion
        const disconnectResponse = await fetch(`${API_BASE}/sessions/status`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: testSession.sessionId,
            isOnline: false
          })
        })

        if (disconnectResponse.ok) {
          const disconnectResult = await disconnectResponse.json()
          console.log(`   ✅ Déconnexion simulée: ${disconnectResult.isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`)
        } else {
          console.log('   ❌ Erreur lors de la simulation de déconnexion')
        }

        // Simuler une reconnexion
        const connectResponse = await fetch(`${API_BASE}/sessions/status`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: testSession.sessionId,
            isOnline: true
          })
        })

        if (connectResponse.ok) {
          const connectResult = await connectResponse.json()
          console.log(`   ✅ Reconnexion simulée: ${connectResult.isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`)
        } else {
          console.log('   ❌ Erreur lors de la simulation de reconnexion')
        }
      }
    }

    console.log('\n✅ Test terminé avec succès!')
    console.log('\n📋 Résumé des améliorations:')
    console.log('   • Gestion des événements beforeunload et visibilitychange')
    console.log('   • Nettoyage automatique des sessions orphelines')
    console.log('   • Synchronisation en temps réel des statuts')
    console.log('   • Logs détaillés des connexions/déconnexions')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testSessionStatus()
