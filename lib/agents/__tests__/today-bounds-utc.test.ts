import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { todayBoundsUtc } from '@/lib/agents/home-types'

describe('todayBoundsUtc (UTC-5 Bogota)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('inicio del dia es T05:00:00Z del dia local', () => {
    // 2026-06-12 12:00 UTC = 2026-06-12 07:00 Bogota
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))
    const { start } = todayBoundsUtc()
    expect(start).toBe('2026-06-12T05:00:00.000Z')
  })

  it('fin del dia es T04:59:59.999Z del dia siguiente', () => {
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))
    const { end } = todayBoundsUtc()
    expect(end).toBe('2026-06-13T04:59:59.999Z')
  })

  it('partido a las 22:00 Bogota (03:00Z siguiente dia) queda dentro del rango', () => {
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))
    const { start, end } = todayBoundsUtc()
    const kickoff = new Date('2026-06-13T03:00:00.000Z')
    expect(kickoff >= new Date(start)).toBe(true)
    expect(kickoff <= new Date(end)).toBe(true)
  })

  it('partido a las 15:00 Bogota (20:00Z mismo dia) queda dentro del rango', () => {
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))
    const { start, end } = todayBoundsUtc()
    const kickoff = new Date('2026-06-12T20:00:00.000Z')
    expect(kickoff >= new Date(start)).toBe(true)
    expect(kickoff <= new Date(end)).toBe(true)
  })

  it('partido a las 23:59 Bogota (04:59Z siguiente dia) queda dentro del rango', () => {
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))
    const { start, end } = todayBoundsUtc()
    const kickoff = new Date('2026-06-13T04:59:00.000Z')
    expect(kickoff >= new Date(start)).toBe(true)
    expect(kickoff <= new Date(end)).toBe(true)
  })

  it('desborde de mes: el fin cruza al mes siguiente correctamente', () => {
    // 2026-06-30 12:00 UTC = 2026-06-30 07:00 Bogota
    vi.setSystemTime(new Date('2026-06-30T12:00:00.000Z'))
    const { start, end } = todayBoundsUtc()
    expect(start).toBe('2026-06-30T05:00:00.000Z')
    expect(end).toBe('2026-07-01T04:59:59.999Z')
  })

  it('desborde de ano: el fin cruza al ano siguiente correctamente', () => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00.000Z'))
    const { start, end } = todayBoundsUtc()
    expect(start).toBe('2026-12-31T05:00:00.000Z')
    expect(end).toBe('2027-01-01T04:59:59.999Z')
  })
})
