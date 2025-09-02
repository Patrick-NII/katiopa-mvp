#!/usr/bin/env python3
"""
Send CubeAI welcome email with login details and plan benefits.

Usage:
  python backend/scripts/send_welcome_email.py \
    --to user@example.com \
    --to-name "Jean Dupont" \
    --account-username "jean.dupont" \
    --account-password "TempPass123" \
    --plan STARTER

Environment variables (recommended):
  HELLO_EMAIL_USER      = hello@cube-ai.fr (communication générale)
  HELLO_EMAIL_PASSWORD  = <SMTP password>
  HELLO_SMTP_SERVER     = smtp.ionos.fr
  HELLO_SMTP_PORT       = 465 (implicit TLS)
  APP_BASE_URL          = https://cube-ai.fr (used for CTA links)

Note: Network sending is not executed here; this script prepares and sends via
standard SMTP using TLS. Ensure the credentials are valid in your environment.
"""

import os
import ssl
import argparse
import smtplib
from email.message import EmailMessage
from typing import List, Dict

# Load .env securely if available
try:
    from dotenv import load_dotenv, find_dotenv  # type: ignore
    load_dotenv(find_dotenv())
except Exception:
    pass

# Configuration des emails par type
EMAIL_CONFIG = {
    "hello": {
        "user": os.getenv("HELLO_EMAIL_USER", "hello@cube-ai.fr"),
        "password": os.getenv("HELLO_EMAIL_PASSWORD"),
        "smtp_server": os.getenv("HELLO_SMTP_SERVER", "smtp.ionos.fr"),
        "smtp_port": int(os.getenv("HELLO_SMTP_PORT", "465")),
        "from_name": "CubeAI - Équipe"
    },
    "support": {
        "user": os.getenv("SUPPORT_EMAIL_USER", "support@cube-ai.fr"),
        "password": os.getenv("SUPPORT_EMAIL_PASSWORD"),
        "smtp_server": os.getenv("SUPPORT_SMTP_SERVER", "smtp.ionos.fr"),
        "smtp_port": int(os.getenv("SUPPORT_SMTP_PORT", "465")),
        "from_name": "CubeAI - Support"
    },
    "noreply": {
        "user": os.getenv("NOREPLY_EMAIL_USER", "noreply@cube-ai.fr"),
        "password": os.getenv("NOREPLY_EMAIL_PASSWORD"),
        "smtp_server": os.getenv("NOREPLY_SMTP_SERVER", "smtp.ionos.fr"),
        "smtp_port": int(os.getenv("NOREPLY_SMTP_PORT", "465")),
        "from_name": "CubeAI"
    }
}

def get_email_config(email_type: str = "hello"):
    """
    Récupère la configuration email selon le type d'email
    
    Args:
        email_type: "hello" (communication générale), "support" (assistance), "noreply" (automatique)
    
    Returns:
        dict: Configuration SMTP pour le type d'email spécifié
    """
    if email_type not in EMAIL_CONFIG:
        raise ValueError(f"Type d'email invalide: {email_type}. Types valides: {list(EMAIL_CONFIG.keys())}")
    
    config = EMAIL_CONFIG[email_type]
    
    if not config["password"]:
        raise ValueError(f"Mot de passe manquant pour {email_type}@cube-ai.fr")
    
    return config

def get_from_address(email_type: str = "hello"):
    """
    Récupère l'adresse d'expédition formatée selon le type d'email
    
    Args:
        email_type: Type d'email (hello, support, noreply)
    
    Returns:
        str: Adresse d'expédition formatée
    """
    config = get_email_config(email_type)
    return f"{config['from_name']} <{config['user']}>"

PLANS: Dict[str, Dict[str, object]] = {
    "STARTER": {
        "label": "Starter",
        "price": "0€",
        "period": "/mois",
        "features": [
            "2 sessions simultanées",
            "1 parent + 1 enfant",
            "Accès complet à la plateforme",
            "Programmation, IA, maths et lecture",
            "Jeux éducatifs et progression",
            "Évaluation et coaching IA basique",
            "3 mois gratuit puis 9,99€/mois",
        ],
    },
    "PRO": {
        "label": "Pro",
        "price": "29,99€",
        "period": "/mois",
        "features": [
            "2 sessions simultanées",
            "1 parent + 1 enfant",
            "Tous les exercices et contenus",
            "Communauté et défis familiaux",
            "Stats détaillées et rapports",
            "Certificats de progression",
            "IA coach personnalisé",
            "Support par email",
        ],
    },
    "PREMIUM": {
        "label": "Premium",
        "price": "69,99€",
        "period": "/mois",
        "features": [
            "6 sessions simultanées",
            "1 parent + jusqu'à 5 enfants",
            "IA coach Premium avancé",
            "Certificats officiels reconnus",
            "Exports PDF/Excel détaillés",
            "Multi-appareils synchronisés",
            "Support prioritaire 24/7",
            "Programme de parrainage",
            "Contenus exclusifs",
        ],
    },
}


def build_email_html(
    to_name: str,
    account_username: str,
    account_password: str,
    plan: str,
    app_base_url: str,
    members: List[Dict[str, str]] | None = None,
    registration_id: str | None = None,
) -> str:
    plan_key = plan.upper()
    plan_info = PLANS.get(plan_key, PLANS["STARTER"])  # fallback
    plan_label = plan_info["label"]
    plan_price = plan_info["price"]
    plan_period = plan_info["period"]
    features: List[str] = plan_info["features"]  # type: ignore

    features_html = "".join(
        f"<li style='margin:6px 0;color:#111827;'>{feat}</li>" for feat in features
    )

    login_url = f"{app_base_url.rstrip('/')}/login"

    members_section = ""
    if members:
        rows = []
        for m in members:
            full_name = f"{m.get('firstName','')} {m.get('lastName','')}".strip()
            ident = m.get('sessionId') or m.get('username') or ''
            pwd = m.get('password') or ''
            role = m.get('userType') or ''
            rows.append(
                "<tr>"
                + f"<td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;'>{full_name}</td>"
                + f"<td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;'><code>{ident}</code></td>"
                + f"<td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;'><code>{pwd}</code></td>"
                + f"<td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;'>{role}</td>"
                + "</tr>"
            )
        members_table = (
            "<div style=\"background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;\">"
            "<div style=\"font-weight:700;color:#111827;margin-bottom:8px;\">Identifiants des membres</div>"
            "<table style=\"width:100%;border-collapse:collapse;\">"
            "<thead>\n<tr>"
            "<th align='left' style=\"padding:6px 12px;color:#6b7280;font-size:12px;font-weight:700;\">Membre</th>"
            "<th align='left' style=\"padding:6px 12px;color:#6b7280;font-size:12px;font-weight:700;\">Identifiant</th>"
            "<th align='left' style=\"padding:6px 12px;color:#6b7280;font-size:12px;font-weight:700;\">Mot de passe</th>"
            "<th align='left' style=\"padding:6px 12px;color:#6b7280;font-size:12px;font-weight:700;\">Rôle</th>"
            "</tr>\n</thead>\n<tbody>"
            + "".join(rows)
            + "</tbody></table></div>"
        )
        members_section = members_table

    reg_block = (
        f"<p style='margin:0 0 8px 0;color:#6b7280;font-size:12px;'>ID d'inscription: <strong style='color:#111827;'>{registration_id}</strong></p>"
        if registration_id else ""
    )

    return f"""
<!doctype html>
<html>
  <head>
    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Bienvenue sur CubeAI</title>
  </head>
  <body style=\"margin:0;padding:0;background:#f3f4f6;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#111827;\">
    <div style=\"max-width:640px;margin:0 auto;padding:24px;\">
      <div style=\"background:#ffffff;border-radius:16px;padding:24px;\">
        <div style=\"text-align:center;margin-bottom:8px;\">\n          <div style=\"display:inline-flex;align-items:center;gap:12px;\">\n            <div style=\"width:36px;height:36px;border-radius:8px;background:linear-gradient(90deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-family:Arial,sans-serif;\">C</div>\n            <div style=\"font-size:18px;font-weight:700;color:#111827;\">CubeAI</div>\n          </div>\n        </div>

        <h1 style=\"font-size:22px;line-height:28px;margin:0 0 8px 0;color:#111827;\">Bienvenue {to_name} 👋</h1>
        <p style=\"margin:0 0 6px 0;color:#374151;\">Votre inscription est confirmée 🎉</p>
        {reg_block}
        <p style=\"margin:0 0 16px 0;color:#374151;\">Voici vos informations de connexion et un récapitulatif de votre offre.</p>

        <div style=\"background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;\">\n          <div style=\"font-weight:700;color:#111827;margin-bottom:8px;\">Vos identifiants</div>\n          <div style=\"margin:4px 0;color:#111827;\"><span style=\"color:#6b7280;\">Identifiant:</span> {account_username}</div>\n          <div style=\"margin:4px 0;color:#111827;\"><span style=\"color:#6b7280;\">Mot de passe:</span> {account_password}</div>\n        </div>

        <div style=\"background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;\">\n          <div style=\"font-weight:700;color:#111827;margin-bottom:8px;\">Votre offre</div>\n          <div style=\"margin:4px 0;color:#111827;\">Plan: <strong>{plan_label}</strong> — <span style=\"color:#111827;font-weight:700;\">{plan_price}</span> <span style=\"color:#6b7280;\">{plan_period}</span></div>\n          <ul style=\"padding-left:18px;margin:8px 0 0 0;\">{features_html}</ul>\n        </div>

        {members_section}

        <div style=\"text-align:center;margin:24px 0;\">\n          <a href=\"{login_url}\"\n             style=\"display:inline-block;background:linear-gradient(90deg,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;\">\n            Se connecter à CubeAI\n          </a>\n        </div>

        <p style=\"margin:0 0 8px 0;color:#374151;\">Besoin d'aide ? Répondez à ce message ou contactez notre support.</p>
        <p style=\"margin:0;color:#6b7280;font-size:12px;\">Cet email a été envoyé par CubeAI - Équipe &lt;hello@cube-ai.fr&gt;.</p>
      </div>

      <p style=\"text-align:center;color:#9ca3af;font-size:12px;margin-top:12px;\">© 2024 CubeAI — Tous droits réservés.</p>
    </div>
  </body>
</html>
"""


def build_email_text(
    to_name: str,
    account_username: str,
    account_password: str,
    plan: str,
    app_base_url: str,
    members: List[Dict[str, str]] | None = None,
    registration_id: str | None = None,
) -> str:
    plan_key = plan.upper()
    plan_info = PLANS.get(plan_key, PLANS["STARTER"])  # fallback
    plan_label = plan_info["label"]
    plan_price = plan_info["price"]
    plan_period = plan_info["period"]
    features: List[str] = plan_info["features"]  # type: ignore
    login_url = f"{app_base_url.rstrip('/')}/login"

    lines = [
        f"Bienvenue {to_name}",
        "",
        "Votre inscription est confirmée.",
    ]
    if registration_id:
        lines += [f"ID d'inscription: {registration_id}", ""]
    lines += [
        "Voici vos informations de connexion et un récapitulatif de votre offre.",
        "",
        "Identifiants:",
        f"  • Identifiant: {account_username}",
        f"  • Mot de passe: {account_password}",
        "",
        f"Offre: {plan_label} — {plan_price} {plan_period}",
        "Avantages:",
    ]
    lines += [f"  • {feat}" for feat in features]

    if members:
        lines += [
            "",
            "Identifiants des membres:",
        ]
        for m in members:
            full_name = f"{m.get('firstName','')} {m.get('lastName','')}".strip()
            ident = m.get('sessionId') or m.get('username') or ''
            pwd = m.get('password') or ''
            role = m.get('userType') or ''
            lines += [f"  • {full_name} ({role}) — {ident} / {pwd}"]

    lines += [
        "",
        f"Se connecter: {login_url}",
        "",
        "Besoin d'aide ? Répondez à ce message ou contactez notre support.",
        "",
        "— CubeAI - Équipe",
    ]
    return "\n".join(lines)


def send_email(
    to_email: str,
    to_name: str,
    account_username: str,
    account_password: str,
    plan: str,
    *,
    email_type: str = "hello",
    app_base_url: str = "https://cube-ai.fr",
    members: List[Dict[str, str]] | None = None,
    registration_id: str | None = None,
):
    subject = "Bienvenue sur CubeAI — Vos accès et avantages"

    # Récupérer la configuration email
    email_config = get_email_config(email_type)

    # Build message
    msg = EmailMessage()
    msg["From"] = get_from_address(email_type)
    msg["To"] = f"{to_name} <{to_email}>"
    msg["Subject"] = subject

    text = build_email_text(to_name, account_username, account_password, plan, app_base_url, members, registration_id)
    html = build_email_html(to_name, account_username, account_password, plan, app_base_url, members, registration_id)

    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    context = ssl.create_default_context()

    # Prefer implicit TLS (465). If fails, fallback to STARTTLS (587)
    try:
        with smtplib.SMTP_SSL(email_config["smtp_server"], email_config["smtp_port"], context=context) as server:
            server.login(email_config["user"], email_config["password"])
            server.send_message(msg)
            print(f"📧 Email de bienvenue envoyé avec succès depuis {email_config['user']}")
            return
    except Exception as e:
        # Fallback: try STARTTLS on 587
        try:
            with smtplib.SMTP(email_config["smtp_server"], 587) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(email_config["user"], email_config["password"])
                server.send_message(msg)
                print(f"📧 Email de bienvenue envoyé avec succès depuis {email_config['user']}")
                return
        except Exception as e2:
            raise RuntimeError(f"SMTP sending failed (SSL:{e}) and (STARTTLS:{e2})")


def main():
    parser = argparse.ArgumentParser(description="Send CubeAI welcome email")
    parser.add_argument("--to", required=True, help="Recipient email")
    parser.add_argument("--to-name", required=True, help="Recipient display name")
    parser.add_argument("--account-username", required=True, help="CubeAI account username")
    parser.add_argument("--account-password", required=True, help="CubeAI account password")
    parser.add_argument("--plan", choices=["STARTER", "PRO", "PREMIUM"], required=True, help="Selected plan")
    parser.add_argument("--members-json", help="JSON array of members with firstName,lastName,sessionId/username,password,userType")
    parser.add_argument("--registration-id", help="Registration identifier to include in the email")
    parser.add_argument("--email-type", choices=["hello", "support", "noreply"], default="hello", help="Type d'email à utiliser")

    # Optional overrides
    parser.add_argument("--app-base-url", default=os.getenv("APP_BASE_URL", "https://cube-ai.fr"))

    args = parser.parse_args()

    members = None
    if args.members_json:
        import json
        try:
            members = json.loads(args.members_json)
            if not isinstance(members, list):
                members = None
        except Exception:
            members = None

    send_email(
        to_email=args.to,
        to_name=args.to_name,
        account_username=args.account_username,
        account_password=args.account_password,
        plan=args.plan,
        email_type=args.email_type,
        app_base_url=args.app_base_url,
        members=members,
        registration_id=args.registration_id,
    )


if __name__ == "__main__":
    main()
