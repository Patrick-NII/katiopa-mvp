#!/usr/bin/env python3
"""
Script Python pour générer les rapports quotidiens automatisés
À exécuter via cron tous les jours à 19:30 Europe/Paris
"""

import os
import sys
import requests
import json
from datetime import datetime, timezone
import logging
from typing import Optional, Dict, Any

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/cubeai-daily-reports.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DailyReportGenerator:
    def __init__(self):
        self.api_url = os.getenv('CUBEAI_API_URL', 'http://localhost:4000')
        self.api_key = os.getenv('CUBEAI_API_KEY')
        self.timezone = os.getenv('TZ', 'Europe/Paris')
        
        if not self.api_key:
            logger.error("CUBEAI_API_KEY non définie")
            sys.exit(1)
    
    def generate_reports(self, target_date: Optional[str] = None) -> bool:
        """
        Génère et envoie les rapports quotidiens
        
        Args:
            target_date: Date au format YYYY-MM-DD (optionnel, utilise aujourd'hui par défaut)
        
        Returns:
            bool: True si succès, False sinon
        """
        try:
            logger.info(f"🚀 Démarrage de la génération des rapports quotidiens")
            
            # Préparer les données de la requête
            payload = {}
            if target_date:
                payload['date'] = target_date
                logger.info(f"📅 Date cible: {target_date}")
            else:
                logger.info(f"📅 Date cible: aujourd'hui")
            
            # Appeler l'API
            response = requests.post(
                f"{self.api_url}/api/reports/generate",
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Rapports générés avec succès: {result.get('message', '')}")
                return True
            else:
                logger.error(f"❌ Erreur API: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erreur de connexion à l'API: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Erreur inattendue: {e}")
            return False
    
    def get_report_statistics(self, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
        """
        Récupère les statistiques des rapports
        
        Args:
            start_date: Date de début au format YYYY-MM-DD
            end_date: Date de fin au format YYYY-MM-DD
        
        Returns:
            Dict avec les statistiques ou None en cas d'erreur
        """
        try:
            response = requests.get(
                f"{self.api_url}/api/reports/statistics",
                params={
                    'startDate': start_date,
                    'endDate': end_date
                },
                headers={
                    'Authorization': f'Bearer {self.api_key}'
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"❌ Erreur lors de la récupération des statistiques: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de la récupération des statistiques: {e}")
            return None
    
    def test_report_generation(self, session_id: str, target_date: Optional[str] = None) -> bool:
        """
        Teste la génération d'un rapport pour une session spécifique
        
        Args:
            session_id: ID de la session à tester
            target_date: Date de test (optionnel)
        
        Returns:
            bool: True si succès, False sinon
        """
        try:
            payload = {}
            if target_date:
                payload['date'] = target_date
            
            response = requests.post(
                f"{self.api_url}/api/reports/test/{session_id}",
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Test de rapport réussi pour la session {session_id}")
                return True
            else:
                logger.error(f"❌ Erreur lors du test: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erreur lors du test: {e}")
            return False

def main():
    """
    Fonction principale du script
    """
    # Vérifier les arguments de ligne de commande
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'generate':
            # Génération normale
            target_date = sys.argv[2] if len(sys.argv) > 2 else None
            generator = DailyReportGenerator()
            success = generator.generate_reports(target_date)
            sys.exit(0 if success else 1)
            
        elif command == 'test':
            # Test pour une session spécifique
            if len(sys.argv) < 3:
                logger.error("❌ Usage: python3 daily_reports.py test <session_id> [date]")
                sys.exit(1)
            
            session_id = sys.argv[2]
            target_date = sys.argv[3] if len(sys.argv) > 3 else None
            
            generator = DailyReportGenerator()
            success = generator.test_report_generation(session_id, target_date)
            sys.exit(0 if success else 1)
            
        elif command == 'stats':
            # Statistiques
            if len(sys.argv) < 4:
                logger.error("❌ Usage: python3 daily_reports.py stats <start_date> <end_date>")
                sys.exit(1)
            
            start_date = sys.argv[2]
            end_date = sys.argv[3]
            
            generator = DailyReportGenerator()
            stats = generator.get_report_statistics(start_date, end_date)
            
            if stats:
                print(json.dumps(stats, indent=2))
                sys.exit(0)
            else:
                sys.exit(1)
                
        else:
            logger.error(f"❌ Commande inconnue: {command}")
            print_usage()
            sys.exit(1)
    else:
        # Génération normale (pour cron)
        generator = DailyReportGenerator()
        success = generator.generate_reports()
        sys.exit(0 if success else 1)

def print_usage():
    """
    Affiche l'aide du script
    """
    print("""
Usage: python3 daily_reports.py [command] [options]

Commandes:
  generate [date]     Génère les rapports quotidiens (date optionnelle au format YYYY-MM-DD)
  test <session_id> [date]  Teste la génération pour une session spécifique
  stats <start_date> <end_date>  Récupère les statistiques des rapports

Exemples:
  python3 daily_reports.py generate
  python3 daily_reports.py generate 2024-12-19
  python3 daily_reports.py test session123
  python3 daily_reports.py test session123 2024-12-19
  python3 daily_reports.py stats 2024-12-01 2024-12-31

Variables d'environnement:
  CUBEAI_API_URL     URL de l'API CubeAI (défaut: http://localhost:4000)
  CUBEAI_API_KEY     Clé API pour l'authentification
  TZ                  Timezone (défaut: Europe/Paris)

Cron (tous les jours à 19:30):
  30 19 * * * /usr/bin/python3 /path/to/daily_reports.py
""")

if __name__ == "__main__":
    main()
