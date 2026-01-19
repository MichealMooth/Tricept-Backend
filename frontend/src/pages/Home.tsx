import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'

export default function Home() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [db, setDb] = useState<string>('unknown')
  const [quote, setQuote] = useState<{ text: string; author?: string } | null>(null)

  useEffect(() => {
    api
      .get('/health')
      .then((res) => {
        setStatus('ok')
        setDb(res.data.db)
      })
      .catch(() => setStatus('error'))
  }, [])

  // Motivational quote: pick a random one on each mount/reload
  const QUOTES = useMemo(
    () => [
      { text: 'Erfolg ist die Summe kleiner Anstrengungen, die jeden Tag wiederholt werden.', author: 'Robert Collier' },
      { text: 'Done is better than perfect.' },
      { text: 'Wer immer tut, was er schon kann, bleibt immer das, was er schon ist.', author: 'Henry Ford' },
      { text: 'Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten.', author: 'Peter Drucker' },
      { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh' },
      { text: 'Fokus schlägt Talent, wenn Talent nicht fokussiert ist.' },
      { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
      { text: 'Die einzige Grenze für unsere Verwirklichung von morgen wird unser Zweifel von heute sein.', author: 'Franklin D. Roosevelt' },
    ],
    []
  )

  useEffect(() => {
    const idx = Math.floor(Math.random() * QUOTES.length)
    setQuote(QUOTES[idx])
  }, [QUOTES])

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <section>
        <h2 className="sr-only">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link to="/my-skills?mode=form" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/10 text-indigo-700 grid place-items-center text-xl">📝</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-indigo-700">Selbsteinschätzung</div>
              <div className="text-sm text-gray-600">Bewerte deine Skills und halte sie aktuell.</div>
            </div>
          </Link>
          <Link to="/strategic-goals" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-fuchsia-600/10 text-fuchsia-700 grid place-items-center text-xl">🎯</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-fuchsia-700">Strategische Ziele</div>
              <div className="text-sm text-gray-600">Monatliche Bewertung (1–5) als Farbpunkte.</div>
            </div>
          </Link>
          <Link to="/my-capacity" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-600/10 text-emerald-700 grid place-items-center text-xl">📅</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-emerald-700">Kapazitätsplanung</div>
              <div className="text-sm text-gray-600">Pflege deine Auslastung nach Monaten.</div>
            </div>
          </Link>
          <Link to="/kurzprofil" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/10 text-indigo-700 grid place-items-center text-xl">👤</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-indigo-700">Kurzprofil</div>
              <div className="text-sm text-gray-600">Erfassen und bearbeiten deines Kurzprofils.</div>
            </div>
          </Link>
          <Link to="/capacities-overview" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-600/10 text-cyan-700 grid place-items-center text-xl">📊</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-cyan-700">Kapazitätsübersicht</div>
              <div className="text-sm text-gray-600">Monatsübersicht aller Mitarbeitenden.</div>
            </div>
          </Link>
          <Link to="/referenz-projekte" className="group rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 hover:shadow-md transition flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-600/10 text-purple-700 grid place-items-center text-xl">📚</div>
            <div>
              <div className="font-semibold text-primary_dark group-hover:text-purple-700">Referenz Projekte</div>
              <div className="text-sm text-gray-600">Themenbereiche für Projekt-Referenzen verwalten.</div>
            </div>
          </Link>
          <div className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5 flex items-start gap-4 opacity-70">
            <div className="h-10 w-10 rounded-lg bg-gray-200 text-gray-500 grid place-items-center text-xl">➕</div>
            <div>
              <div className="font-semibold text-primary_dark">Platz für Erweiterungen</div>
              <div className="text-sm text-gray-600">Widgets wie Aufgaben, Ziele, Benachrichtigungen …</div>
            </div>
          </div>
        </div>
      </section>

      {/* Heute: Impuls + Systemstatus */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Impuls modern */}
          <div className="relative overflow-hidden rounded-xl shadow-soft ring-1 ring-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-cyan-500/10 to-emerald-500/15" />
            <div className="relative p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none select-none">“</div>
                <div>
                  <div className="text-xl font-semibold text-primary_dark leading-snug">{quote?.text}</div>
                  {quote?.author && <div className="text-sm text-gray-600 mt-2">— {quote.author}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Systemstatus mit Badges */}
          <div className="rounded-xl bg-white p-6 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-primary_blue">Systemstatus</h2>
              <button
                className="text-sm px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setStatus('loading')
                  api.get('/health').then((res) => { setStatus('ok'); setDb(res.data.db) }).catch(() => setStatus('error'))
                }}
              >
                Aktualisieren
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm ring-1 ring-black/5 ${status === 'ok' ? 'bg-emerald-50 text-emerald-700' : status === 'loading' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                <span className={`h-2 w-2 rounded-full ${status === 'ok' ? 'bg-emerald-500' : status === 'loading' ? 'bg-amber-500' : 'bg-red-500'}`} />
                Backend {status === 'ok' ? 'verbunden' : status === 'loading' ? 'prüfe…' : 'fehler'}
              </span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm ring-1 ring-black/5 bg-cyan-50 text-cyan-700">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Datenbank: {db}
              </span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm ring-1 ring-black/5 bg-gray-50 text-gray-700">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Zeit: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
