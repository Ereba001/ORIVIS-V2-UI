# ORIVIS V2 — UI

A modern, secure frontend for the Orivis governance platform. Built with Vite + React + TypeScript + Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

The app runs on [localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Backend

Consumes the Orivis Laravel API at `http://localhost:8000/api/v1` (configurable via `VITE_API_URL` env var). The backend lives in `../backend/`.
