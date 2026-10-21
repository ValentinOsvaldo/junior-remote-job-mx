# junior/mx

Junior, trainee and intern programming jobs in Mexico. A Python scraper ([jobspy](https://github.com/speedyapply/JobSpy)) writes a JSON file; a React app reads it. No server yet.

Needs Node 24, pnpm and Docker. Python is only needed inside the container.

```bash
pnpm install          # web deps
pnpm scrape           # Docker: Indeed + LinkedIn + Glassdoor -> apps/web/public/data/jobs.json (~15-25 min)
pnpm scrape --fast    # skip per-job description requests (a few minutes, no summaries)
pnpm reclassify       # re-run the filters on the last scrape (apps/scraper/.cache) in seconds
pnpm dev              # http://localhost:5173
pnpm test             # scraper tests (Docker) + web search tests
```

Without Docker (needs [uv](https://docs.astral.sh/uv/)): `pnpm scrape:local`, `pnpm test:scraper:local`.
CI (`.github/workflows/ci.yml`) runs the scraper tests in the same Docker image, plus typecheck, lint, tests and build for the web.

Scraper flags: `--sites`, `--results` (per site per term), `--hours`, `--terms`, `--out`, `--fresh` (ignore the existing file).
Each run merges with the existing file and drops postings older than 30 days.

## Layout

```
apps/scraper/   Python (uv). cli.py = fetch + merge + write, classify.py = all filtering rules
apps/web/       Vite + React 19 + Tailwind v4
  src/lib/jobs-source.ts   the only data access point (static JSON today)
  src/lib/search.ts        query parser + MiniSearch index
  src/store/filters.ts     zustand, synced to the URL
  src/components/ui/       design-system primitives
  src/features/jobs/       list, card, filters, search
```

**Adding a server later:** create `apps/api` (e.g. FastAPI) that imports `scraper.classify` / `scraper.cli`, serves
`GET /api/jobs?cursor=&q=&...` returning the same `JobsPage` shape (`apps/web/src/lib/types.ts`), and swap the body of
`fetchJobsPage` in `jobs-source.ts` for a `fetch`. Nothing else in the UI changes.

## Search syntax

| Query | Meaning |
|---|---|
| `react node` | all words (prefix + fuzzy) |
| `"home office"` | exact phrase |
| `-angular` | exclude (works with phrases and fields too) |
| `stack:python` `empresa:globant` `fuente:linkedin` | field match |
| `ciudad:gdl` `estado:jalisco` | location (`gdl`, `mty`, `cdmx` understood) |
| `nivel:becario` `area:mobile` `modo:remoto` | level / category / modality |
| `sueldo:>15k` `sueldo:12k-20k` | monthly MXN |
