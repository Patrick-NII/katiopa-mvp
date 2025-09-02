// Configuration des emails par type
export const EMAIL_CONFIG = {
    hello: {
        user: process.env.HELLO_EMAIL_USER || "hello@cube-ai.fr",
        password: process.env.HELLO_EMAIL_PASSWORD,
        smtpServer: process.env.HELLO_SMTP_SERVER || "smtp.ionos.fr",
        smtpPort: parseInt(process.env.HELLO_SMTP_PORT || "465"),
        fromName: "CubeAI - Équipe"
    },
    support: {
        user: process.env.SUPPORT_EMAIL_USER || "support@cube-ai.fr",
        password: process.env.SUPPORT_EMAIL_PASSWORD,
        smtpServer: process.env.SUPPORT_SMTP_SERVER || "smtp.ionos.fr",
        smtpPort: parseInt(process.env.SUPPORT_SMTP_PORT || "465"),
        fromName: "CubeAI - Support"
    },
    noreply: {
        user: process.env.NOREPLY_EMAIL_USER || "noreply@cube-ai.fr",
        password: process.env.NOREPLY_EMAIL_PASSWORD,
        smtpServer: process.env.NOREPLY_SMTP_SERVER || "smtp.ionos.fr",
        smtpPort: parseInt(process.env.NOREPLY_SMTP_PORT || "465"),
        fromName: "CubeAI"
    }
} as const;

export type EmailType = keyof typeof EMAIL_CONFIG;

export function getEmailConfig(emailType: EmailType = "noreply") {
    /**
     * Récupère la configuration email selon le type d'email
     * 
     * @param emailType - "hello" (communication générale), "support" (assistance), "noreply" (automatique)
     * @returns Configuration SMTP pour le type d'email spécifié
     */
    const config = EMAIL_CONFIG[emailType];
    
    if (!config.password) {
        throw new Error(`Mot de passe manquant pour ${emailType}@cube-ai.fr`);
    }
    
    return config;
}

export function getFromAddress(emailType: EmailType = "noreply"): string {
    /**
     * Récupère l'adresse d'expédition formatée selon le type d'email
     * 
     * @param emailType - Type d'email (hello, support, noreply)
     * @returns Adresse d'expédition formatée
     */
    const config = getEmailConfig(emailType);
    return `${config.fromName} <${config.user}>`;
}
