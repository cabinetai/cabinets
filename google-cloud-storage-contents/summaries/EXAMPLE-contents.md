---
headline: 1,860 files, 210 GB — daily analytics exports and the models trained on them
overview: This is a data bucket. Every morning an export lands under /warehouse as Parquet, partitioned by date, and /models holds the trained artifacts that come out the other end. A small /scratch folder looks like one person's working area.
verdict: The scratch folder holds a 40 GB copy of last year's warehouse, untouched since March.
source: Google Cloud Storage
generated: 2026-08-13 09:00
status: ok
seeded: true
---

| File | What it is | Size | Modified |
|---|---|---|---|
| warehouse/dt=2026-08-13/events-000.parquet | Today's event export, first shard | 1.8 GB | 2026-08-13 |
| warehouse/dt=2026-08-13/events-001.parquet | Today's event export, second shard | 1.7 GB | 2026-08-13 |
| models/churn/2026-08-12/model.pkl | Churn model, latest training run | 310 MB | 2026-08-12 |
| models/churn/2026-08-12/metrics.json | Scores for that training run | 8 KB | 2026-08-12 |
| warehouse/dt=2026-08-12/events-000.parquet | Yesterday's event export | 1.8 GB | 2026-08-12 |
| scratch/warehouse-copy-2025/events.parquet | Someone's copy of last year's data | 40 GB | 2026-03-04 |
| schemas/events-v3.json | Column definitions for the export | 22 KB | 2025-11-19 |
| README.txt | Two lines explaining the folder layout | 1 KB | 2025-06-02 |
