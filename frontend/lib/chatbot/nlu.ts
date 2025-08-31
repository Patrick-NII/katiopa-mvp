
// lib/nlu.ts
// Basic NLU helpers: normalization, tokenization, stopwords, intent detection.

export type Intent =
  | 'signup' | 'pricing' | 'subscribe'
  | 'age' | 'subjects' | 'security' | 'vision'
  | 'contact' | 'method' | 'parents'
  | 'joke' | 'story' | 'lesson' | 'math_problem'
  | 'greeting' | 'goodbye' | 'help' | 'unknown'

const STOP = new Set<string>([
  'le','la','les','de','des','du','un','une','et','ou','au','aux','dans','sur','pour','par','avec','sans',
  'est','sont','je','tu','il','elle','on','nous','vous','ils','elles','que','qui','quoi','mon','ma','mes',
  'ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leur','leurs','ce','cet','cette','ces','d’','l’','n’'
]);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,''); // strip accents
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t && !STOP.has(t));
}

export function detectIntent(text: string): Intent {
  const t = normalize(text);
  if (/\b(bonjour|salut|hello|hey)\b/.test(t)) return 'greeting';
  if (/\b(au revoir|bye)\b/.test(t)) return 'goodbye';
  if (t.startsWith('/help')) return 'help';

  if (/\b(inscription|inscrire|compte|commencer)\b/.test(t)) return 'signup';
  if (/\b(prix|tarifs?|abonn(?:ement|er)?)\b/.test(t)) return 'pricing';
  if (/\b(souscri|payer)\b/.test(t)) return 'subscribe';

  if (/\b(ag|age|âge|enfant|5|6|7)\b/.test(t)) return 'age';
  if (/\b(math|programmation|ia|jeux|mati(ere|ères)|matiere|matieres)\b/.test(t)) return 'subjects';
  if (/\b(securite|sécurité|rgpd|donnees|données|confidentialite)\b/.test(t)) return 'security';
  if (/\b(vision|idee|idée|volonte|volonté|pourquoi|objectif)\b/.test(t)) return 'vision';
  if (/\b(contact|support|email|telephone|téléphone)\b/.test(t)) return 'contact';
  if (/\b(methode|méthode|progression|evaluation|certificat)\b/.test(t)) return 'method';
  if (/\b(parent|parents|recompense|récompense|defi|défi)\b/.test(t)) return 'parents';

  if (/\b(blague|rire|devinette|rigolo)\b/.test(t)) return 'joke';
  if (/\b(histoire|conte|story)\b/.test(t)) return 'story';
  if (/\b(lecon|leçon|explique|apprends|cours)\b/.test(t)) return 'lesson';
  if (/\b(exercice|probleme|problème|calcul|entrainement)\b/.test(t)) return 'math_problem';

  return 'unknown';
}
