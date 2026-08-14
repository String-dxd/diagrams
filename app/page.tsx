import Link from 'next/link'

const tools = [
  {
    href: '/tools/circuits',
    title: 'Circuit Diagrams (Pri)',
    description: 'Draw symbol or object-style circuit diagrams for primary school. Export as PNG.',
    badge: 'Symbol · Object',
  },
  {
    href: '/tools/circuits-secjc',
    title: 'Circuit Diagrams (Sec/JC)',
    description: 'Draw circuit diagrams with Sec/JC components: transistor, transformer, and more.',
    badge: 'Sec · JC',
  },
  {
    href: '/tools/water-tank',
    title: 'Water Tank Diagram Generator',
    description: 'Generate water tank diagrams with customisable dimensions and water levels.',
    badge: 'Pri · Sec',
  },
  {
    href: '/tools/isometric-cube',
    title: 'Isometric Cube Builder',
    description: 'Build 3D cube structures and generate top, front, and side views.',
    badge: 'PSLE spatial',
  },
  {
    href: '/tools/seed-dispersal',
    title: 'Seed Dispersal Diagram',
    description: 'Create and export seed dispersal maps for primary science. Practice and creator modes.',
    badge: 'Pri Sci',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagram Tools</h1>
        <p className="text-gray-500 mb-10">Teaching tools for creating clean, exportable diagrams.</p>
        <div className="grid gap-4">
          {tools.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className="group block bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">{t.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                </div>
                <span className="shrink-0 text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">{t.badge}</span>
              </div>
            </Link>
          ))}
        </div>
        <footer className="mt-16 text-xs text-gray-400">
          Created by Julienne, supported by{' '}
          <a href="https://string.sg" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
            string.sg
          </a>
        </footer>
      </div>
    </main>
  )
}
