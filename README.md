# AI Revenue Agent

A **separate project from FLOP ComputePilot** for triaging coding bounties and other paid AI-assisted jobs. It includes a mobile-friendly Netlify preview in `index.html`, and a read-only offline candidate filter in `scanner.py`.

## Current capabilities

- Static dashboard for demo jobs, sample economics and status.
- Import JSON candidate exports and deduplicate HTTPS URLs.
- Conservative HOLD / REJECT / HUMAN_REVIEW_REQUIRED eligibility decisions.
- $500 maximum estimated investment per opportunity for evaluation only; every expense requires explicit approval.
- Netlify static hosting via `netlify.toml`.

## Run the scanner

```sh
python3 scanner.py examples.json
python3 -m unittest -v test_scanner.py
```

The dashboard searches public GitHub issues live, but results are NOT verified funded bounties. The Python scanner **does not discover live bounties** by itself. You must supply candidates and independently verify funding, issue status, competing pull requests, platform AI-assistance rules, payout eligibility and feasibility. Unknown verification flags result in HOLD. Estimated win probabilities are assumptions. Even a positive score requires human approval.

## Deployment

Connect this repository to a new Netlify site. Base directory: repository root. Build command: leave blank. Publish directory: `.`. The GitHub repository contains a static front-end; there is no live backend, automatic inference, transaction signing, wallet connection, payout, spending, or autonomous submission.

**As of October 14, 2026: 0 verified jobs, $0 spent, $0 earned.** The page uses clearly fictional examples. Do not share tokens, passwords, or payout credentials in code.
