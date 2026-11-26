# World News, 25 November 2026 — Storm Grounds the Parade

[![make.fun · news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/fatarichi/news-image-20261125/rank.svg)](https://make.fun/bounty/news-image-20261125/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/fatarichi/news-image-20261125/reward.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)

Entry for the make.fun competition
[news-image-20261125 — "Sum up 25 November's world news in one image"](https://make.fun/c/news-image-20261125).

A newspaper front page drawn entirely in code (Node 22, standard library only).
No photos, no copied artwork, no network — every pixel is drawn by `main.ts`:
a storm scene for the postponed 100th Macy's Thanksgiving Day Parade, a
Wednesday markets strip, three scene panels (mines in the Gulf, US tariffs,
Shenzhou-24), and 24 numbered briefs. 28 stories in all, every one checked
against its event date in `../notes/verification.md` (kept outside this repo).

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` — 1024×1024 PNG, deterministic (two runs are byte-identical).

## License

MIT — see `LICENSE`.
