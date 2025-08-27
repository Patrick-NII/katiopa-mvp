export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success'; children: React.ReactNode }) {
  return <div role="alert" className={`rounded-lg border px-3 py-2 text-sm ${kind==='error'?'border-red-200 bg-red-50 text-red-800':'border-green-200 bg-green-50 text-green-800'}`}>{children}</div>
}
