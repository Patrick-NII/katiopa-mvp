
# Katiopa Assistant — Chatbot complet (Front + API + KB)

Ce bundle contient :
- `components/ChatBubble.tsx` : composant React/Next.js (client) avec mémoire locale, intents, RAG lexical, persona enfant/parent, UI agrandie.
- `lib/nlu.ts` : NLU basique (normalisation, tokenisation, détection d’intentions).
- `lib/types.ts` : types partagés.
- `pages/api/chat.ts` : fallback LLM optionnel (OpenAI), configurable via `OPENAI_API_KEY`.
- `public/data/*.json` : bases de connaissances extensibles (site, pédagogie, fun enfants, mini-leçons, sciences, histoires courtes, problèmes de maths).

## Intégration
1. Copiez `components`, `lib`, `pages/api`, `public/data` dans votre projet Next.js.
2. Importez le composant dans votre layout/page :
   ```tsx
   import dynamic from 'next/dynamic'
   const ChatBubble = dynamic(() => import('../components/ChatBubble'), { ssr: false })

   export default function Page() {
     return (
       <main>
         {/* ... votre contenu ... */}
         <ChatBubble />
       </main>
     )
   }
   ```
3. Activez le LLM (optionnel) :
   - Ajoutez `OPENAI_API_KEY` dans `.env.local`.
   - Vous pouvez définir `OPENAI_MODEL` (par défaut `gpt-4o-mini`).

## Commandes dans le chat
- `/help` — aide
- `/reset` — efface la conversation locale
- `/export` — export JSON local
- `/mode kid` — ton enfant (5–7 ans)
- `/mode pro` — ton parent/pro

## Personnalisation
- Ajoutez/éditez les fichiers `public/data/*.json` pour enrichir les réponses.
- Les entrées acceptent `a_kid` (enfant) et `a_pro` (parent). Si l’un manque, l’autre est utilisé.
- Ajoutez vos routes réelles dans `LINKS` pour les boutons d’action.

## Sécurité et RGPD
- Le composant n’envoie rien par défaut vers un serveur, sauf si vous utilisez `/api/chat`.
- Pour des logs/analytiques, implémentez un backend dédié et respectez le RGPD.

Bon développement.
