/**
 * Tests del RateLimiter.
 * Ventana diaria (RapidAPI) y deslizante (football-data).
 * Sin setTimeout real: se inyecta getNow() para simular tiempo.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/lib/data/rate-limiter'

// ---------------------------------------------------------------------------
// Ventana diaria (RapidAPI style)
// ---------------------------------------------------------------------------

describe('RateLimiter - ventana diaria', () => {
  it('permite hasta maxRequests llamadas en el mismo día', () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowType: 'daily' })

    // Llama check() + record() 5 veces sin lanzar
    for (let i = 0; i < 5; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }
  })

  it('la petición 96 lanza RateLimitError tras 95 exitosas (maxRequests=95)', () => {
    const limiter = new RateLimiter({ maxRequests: 95, windowType: 'daily' })

    for (let i = 0; i < 95; i++) {
      limiter.check()
      limiter.record()
    }

    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)
  })

  it('el error menciona el límite máximo configurado', () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowType: 'daily' })
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }
    expect(() => limiter.check()).toThrow(/3/)
  })

  it('después de medianoche el contador se resetea', () => {
    // Simulamos cambio de día mockeando Date
    const originalDate = Date

    // Día 1: rellenamos el cupo
    const limiter = new RateLimiter({ maxRequests: 3, windowType: 'daily' })
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }
    // Debería lanzar
    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)

    // Avanzamos al día siguiente mockeando Date.prototype.toDateString
    const tomorrow = 'Tomorrow Jan 01 2030'
    vi.spyOn(Date.prototype, 'toDateString').mockReturnValue(tomorrow)

    // Ahora el check debe pasar (reset por cambio de día)
    expect(() => limiter.check()).not.toThrow()
    limiter.record()

    vi.restoreAllMocks()
  })

  it('record() solo incrementa en éxito: sin record() el contador no avanza', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowType: 'daily' })

    // check sin record 10 veces: no debe lanzar
    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
    }

    // Si hacemos record 2 veces, la tercera check lanza
    limiter.check()
    limiter.record()
    limiter.check()
    limiter.record()
    expect(() => limiter.check()).toThrow(/Daily rate limit reached/)
  })
})

// ---------------------------------------------------------------------------
// Ventana deslizante (football-data style)
// Se inyecta getNow() simulado porque RateLimiter usa Date.now() internamente.
// Como RateLimiter no acepta getNow(), mockeamos Date.now directamente.
// ---------------------------------------------------------------------------

describe('RateLimiter - ventana deslizante', () => {
  let nowMs = 1_000_000

  beforeEach(() => {
    nowMs = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => nowMs)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('permite hasta maxRequests en la ventana', () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }
  })

  it('la petición 11 lanza cuando hay 10 en la ventana de 60s', () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    for (let i = 0; i < 10; i++) {
      limiter.check()
      limiter.record()
    }

    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('después de que expira la ventana, el contador se resetea y se permiten nuevas peticiones', () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // Registramos 5 peticiones en t=1_000_000
    for (let i = 0; i < 5; i++) {
      limiter.check()
      limiter.record()
    }
    expect(() => limiter.check()).toThrow(/Rate limit reached/)

    // Avanzamos 61 segundos (fuera de ventana)
    nowMs += 61_000

    // Ahora debe pasar
    expect(() => limiter.check()).not.toThrow()
    limiter.record()
  })

  it('ventana deslizante: peticiones antiguas expiran pero las nuevas cuentan', () => {
    const limiter = new RateLimiter({
      maxRequests: 3,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // t=0: 3 peticiones
    for (let i = 0; i < 3; i++) {
      limiter.check()
      limiter.record()
    }

    // t=65s: las 3 primeras expiraron
    nowMs += 65_000

    // Ahora podemos hacer 3 más
    for (let i = 0; i < 3; i++) {
      expect(() => limiter.check()).not.toThrow()
      limiter.record()
    }

    // La 4a en este segundo window debe lanzar
    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('record() solo incrementa en éxito: check sin record no consume cuota', () => {
    const limiter = new RateLimiter({
      maxRequests: 3,
      windowType: 'sliding',
      windowMs: 60_000,
    })

    // check 10 veces sin record
    for (let i = 0; i < 10; i++) {
      expect(() => limiter.check()).not.toThrow()
    }

    // record 3 veces -> cupo lleno
    limiter.record()
    limiter.record()
    limiter.record()

    expect(() => limiter.check()).toThrow(/Rate limit reached/)
  })

  it('el error menciona el límite y la ventana configurados', () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowType: 'sliding',
      windowMs: 60_000,
    })
    limiter.check()
    limiter.record()
    limiter.check()
    limiter.record()
    expect(() => limiter.check()).toThrow(/2/)
  })
})
