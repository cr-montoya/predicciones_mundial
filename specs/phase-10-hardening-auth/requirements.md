# Requirements: Fase 10 - Hardening y autenticacion

## Estado

Completada como base. Ajustes posteriores de CSP/env vars se manejan en fixes especificos.

## Objetivo

Asegurar la app con rate limiting, autenticacion simple y headers de seguridad.

## Requerimientos

1. Implementar rate limit por IP.
2. Crear soporte de usuarios y password hash.
3. Emitir JWT en cookie httpOnly.
4. Proteger operaciones sensibles.
5. Agregar security headers.
6. Evitar exposicion de secrets.

## Criterios de éxito

1. Tests de auth/rate limit pasan.
2. Security no reporta criticos.
3. Headers principales presentes.
