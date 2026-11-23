# CAMPANIA LIFE — API REST

Base URL: `http://localhost:8000/api` (in sviluppo Vite fa da proxy da `/api`).

Autenticazione: JWT Bearer. Invia `Authorization: Bearer <access_token>`.

---

## `GET /health`
```json
{ "status": "ok", "service": "Campania Life API", "version": "1.0.0" }
```

## `POST /auth/register`
```json
{ "name": "Antonio", "email": "antonio@example.it", "password": "secret123" }
```
Risposta `201`:
```json
{ "access_token": "...", "token_type": "bearer", "user": { "id": "...", "name": "Antonio", "email": "..." } }
```

## `POST /auth/login`
```json
{ "email": "antonio@example.it", "password": "secret123" }
```
Risposta uguale a `/auth/register`.

## `GET /auth/me`
Restituisce i dati utente. Richiede token.

## `GET /saves/current`
```json
{ "payload": { ...stato di gioco... }, "version": 7, "saved_at": "2026-11-23T10:12:00Z" }
```
Se non esiste un salvataggio: `{ "payload": null, "version": 1, "saved_at": null }`.

## `PUT /saves/current`
```json
{ "payload": { ...stato di gioco... } }
```
Crea o aggiorna il salvataggio (JSONB), incrementa `version`, aggiorna `characters` e `achievements`. Limite: 2 MB.

## `GET /profile/me`
Restituisce personaggio, livello, denaro e creature catturate.

## `GET /leaderboard`
Array dei primi 50 giocatori ordinati per livello, ricchezza e collezione.

---

## Schema PostgreSQL

Tabella | Scopo
---|---
`users` | account, email unica, hash bcrypt
`characters` | personaggio principale sincronizzato dal salvataggio
`game_saves` | payload JSONB versionato, uno per utente
`transactions` | storico movimenti (pronto per analytics)
`achievements` | obiettivi sbloccati, PK `(user_id, code)`
`v_leaderboard` | vista calcolata dal payload JSONB

Lo schema è in `server/sql/001_init.sql` e viene applicato all'avvio con `CREATE TABLE IF NOT EXISTS`.
