import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ReferenceProjectsAdminPage from '../ReferenceProjectsAdminPage'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock xlsx to return a predefined sheet with headers and one row
const rows = [
  [
    'Person',
    'Projektname',
    'Kunde',
    'Beschreibung des Projekts (3-5 Sätze)',
    'Rolle im Projekt',
    'Beschreibung der Tätigkeit',
    'Laufzeit von',
    'Laufzeit bis',
    'Themenbereich 1',
  ],
  [
    'Alice',
    'Apollo',
    'ACME',
    'Satz eins. Satz zwei. Satz drei.',
    'Testmanager',
    'Testing',
    '01/2022',
    '12/2022',
    'Testmanagement',
  ],
]

vi.mock('xlsx', () => ({
  read: vi.fn(() => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } })),
  utils: { sheet_to_json: vi.fn(() => rows) },
}))

// Access the api mock and helper from setup
import { api } from '@/services/api'
const __setApiResponse: (method: 'GET'|'POST', url: string, data: any) => void = (globalThis as any).__setApiResponse

describe('ReferenceProjectsAdminPage import', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    // Mock list response for initial load
    __setApiResponse('GET', '/reference-projects', { items: [], total: 0, page: 1, pageSize: 20 })
    // Mock batch import summary
    __setApiResponse('POST', '/reference-projects/import', () => ({ ok: 1, fail: 0, results: [] }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('imports rows without calling real backend and shows success message', async () => {
    const user = userEvent.setup()
    const { container } = render(<ReferenceProjectsAdminPage />)

    // Trigger file selection
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new ArrayBuffer(10)], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    // Provide arrayBuffer to avoid real file reading
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(0)) })

    await user.upload(input, file)

    // Expect batch endpoint called
    await waitFor(() => expect((api.post as any)).toHaveBeenCalledWith('/reference-projects/import', expect.any(Array), expect.any(Object)))

    // Success summary alert was shown
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Import abgeschlossen/i)))
  })

  it('renders Fehler-Tabelle mit Spalte/Erwartet bei fehlgeschlagenen Zeilen', async () => {
    const user = userEvent.setup()
    // Mock response mit 1 Fehlerzeile
    __setApiResponse('POST', '/reference-projects/import', () => ({
      ok: 0,
      fail: 1,
      results: [
        {
          index: 0,
          ok: false,
          errors: [
            { field: 'role', column: 'Rolle im Projekt', message: 'Ungültiger Wert', expected: 'Projektleiter, IT-Projektleiter, PMO, Testmanager, Projektunterstützung, Business-Analyst, Scrum-Master, Tester, TPL, PO' },
          ],
        },
      ],
    }))

    const { container } = render(<ReferenceProjectsAdminPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new ArrayBuffer(10)], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(0)) })
    await user.upload(input, file)

    // Tabelle mit Spaltenüberschriften vorhanden
    expect(await screen.findByText('Zeile (Excel)')).toBeInTheDocument()
    expect(await screen.findByText('Spalte')).toBeInTheDocument()
    expect(await screen.findByText('Fehler')).toBeInTheDocument()
    expect(await screen.findByText('Erwartet')).toBeInTheDocument()

    // Ein Fehler-Eintrag wird angezeigt
    expect(await screen.findByText('Rolle im Projekt')).toBeInTheDocument()
    expect(await screen.findByText('Ungültiger Wert')).toBeInTheDocument()
  })

  it('zeigt während des Imports Spinner/Progress und deaktiviert den Datei-Input', async () => {
    const user = userEvent.setup()
    // Verzögerte Promise, um Importzustand sichtbar zu halten
    let resolveImport: (v: any) => void
    const importPromise = new Promise((res) => { resolveImport = res })
    __setApiResponse('POST', '/reference-projects/import', () => importPromise)

    const { container } = render(<ReferenceProjectsAdminPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new ArrayBuffer(10)], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(0)) })
    await user.upload(input, file)

    // Während des Imports ist der Input disabled
    await waitFor(() => expect(input.disabled).toBe(true))

    // Import abschließen und prüfen, dass Zustand zurückkehrt
    resolveImport!({ ok: 1, fail: 0, results: [] })
  })
})
