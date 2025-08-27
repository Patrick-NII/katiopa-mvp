import Link from 'next/link'
import NavBar from '@/components/NavBar'

export default function Home() {
  return (
    <>
      <NavBar />
      <section className="container-narrow">
        <div className="card">
          <h1 className="text-2xl font-bold mb-2">Bienvenue sur Katiopa</h1>
          <p className="text-gray-600 mb-4">Apprendre en jouant : maths, code et mini-jeux pour 5–7 ans.</p>
          <div className="space-x-3">
            <Link className="btn btn-primary" href="/register">Commencer</Link>
            <Link className="btn" href="/login">J’ai déjà un compte</Link>
          </div>
        </div>
      </section>
    </>
  )
}