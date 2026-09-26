# PawMatch
Personal project shared for reference only. © 2026 Serika Kawano. All rights reserved. No permission is granted to copy, modify, or redistribute this work.

This repository is a reviewed source snapshot for the PawMatch research prototype. It was prepared without copying the development repository's commit history, local database, environment files, or old Assessment backups.

## Run locally

Requires Node.js and pnpm. From this directory:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The site uses synthetic pet and applicant records without MongoDB. MongoDB is optional: `.env.example` contains a local-only example connection string. Never publish a real connection string or use real identity documents in this demo.

The login screen lets a reviewer select a synthetic account; it is **not production authentication**. Do not expose a running instance to the public Internet without separate authentication, data-isolation, and deployment review.

## Research scope

The visible demo focuses on pet care needs, applicant evidence, unresolved checks, a six-stage human review, adjustable provisional weights, and administrator history. No automatic adoption decision is made. The five-participant formative evaluation is described in [`docs/formative-evaluation-protocol.md`](docs/formative-evaluation-protocol.md); click-through time and adoption-rate claims are not its outcome measures. Older A/B simulation code is retained for reproducibility but is not linked as the current evaluation workflow.

Draft reports in Japanese and English and the reference audit are under `docs/`. The reports predate this source snapshot and still need their repository-status sentence updated before final submission. Animal photos and all people, applications, and review records are synthetic.
