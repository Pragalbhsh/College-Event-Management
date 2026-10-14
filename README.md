# Campus Pulse — Student Feedback Management

Web app for collecting and reviewing course feedback. Students submit ratings, faculty see course summaries, and admins manage the catalog. Accounts are stored in SQLite; passwords are hashed with bcrypt and sessions use JWT.

## Run locally

```bash
cd server && npm install && npx prisma migrate dev --name init && npm run db:seed && npm run dev
```

In another terminal:

```bash
cd client && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API: [http://localhost:4000](http://localhost:4000).

## Demo accounts

Password for every seeded user: `password123`

| Role | Email |
| --- | --- |
| Admin | `admin@campus.edu` |
| Faculty | `priya.nair@campus.edu`, `ravi.iyer@campus.edu` |
| Student | `anu.sharma@campus.edu`, `kabir.das@campus.edu`, `meera.joshi@campus.edu` |
