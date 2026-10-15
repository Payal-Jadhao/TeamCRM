# TeamCRM Database

This directory contains the complete database schema, demo seed data, and Docker container configurations for TeamCRM.

## Contents
- **`schema.sql`**: Full DDL schema (17 tables, indexes, constraints, audit tracking, soft-deletes).
- **`seed.sql`**: Comprehensive demo seed data with 6 user profiles across 3 roles and 5 team tags, projects, Kanban tasks, live timers, discussions, API contracts, meetings, and CRM pipeline.
- **`docker-compose.yml`**: PostgreSQL 16 + pgAdmin 4 ready-to-run container stack.

## Usage Options

### Option 1: Zero-Config In-Memory Mode (Recommended for instant testing)
The Spring Boot backend is already configured with an in-memory / file-based H2 database running in PostgreSQL compatibility mode and automatically initialized with seed data. You do not need to install or run PostgreSQL manually.

### Option 2: Docker PostgreSQL
If Docker is installed and running:
```bash
cd db
docker compose up -d
```
Access points:
- PostgreSQL: `localhost:5432` (DB: `teamcrm`, User: `teamcrm_user`, Pass: `teamcrm_password`)
- pgAdmin: `http://localhost:5050` (Email: `admin@teamcrm.com`, Pass: `adminpassword`)

### Option 3: Existing PostgreSQL Instance
Run the scripts using `psql`:
```bash
psql -U postgres -d teamcrm -f schema.sql
psql -U postgres -d teamcrm -f seed.sql
```
