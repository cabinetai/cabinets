{
  "server": "engine/server.mjs",
  "jobs": [
    { "id": "refresh", "schedule": "*/5 * * * *", "run": "engine/refresh.mjs", "timeoutSec": 240 }
  ]
}
