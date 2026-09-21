# CivicConnect AI — System Architecture & Specification

## System Topography
- Frontend: React + Tailwind + Leaflet (Port 5173)
- API Gateway: Express + Socket.IO (Port 5000)
- AI Engine: FastAPI + Groq + MiniLM (Port 8000)
- Database: MongoDB Atlas (M0 Free Tier)

## Checkpoints
- Checkpoint 1: Mongoose Models (Ticket, AuditLedger) + SHA-256 hashChain.js
- Checkpoint 2: FastAPI AI Service (Groq LLaMA-3.1 Triage + Uber H3/MiniLM Deduplication)
- Checkpoint 3: Ingestion Gateway & Telegram Bot Webhook
- Checkpoint 4: React PWA + Leaflet GIS Map with Jitter
- Checkpoint 5: Representative Dashboard + Proof-of-Fix Quorum
