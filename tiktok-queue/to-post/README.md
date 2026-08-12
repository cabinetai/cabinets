---
title: Drop videos here
created: '2026-08-12T00:00:00Z'
modified: '2026-08-12T00:00:00Z'
tags: [tiktok, video]
---
# Drop videos here

Put a finished `.mp4` in this folder. At 6pm it goes up on your TikTok account as a
**private** post — on your profile, where only you can see it — and you decide in the
TikTok app whether to release it.

Up to three videos go out per evening. Anything else waits its turn.

## Giving one a caption

Save a plain text file with the same name as the video and `.txt` on the end:

```
kitchen-reno-day-4.mp4
kitchen-reno-day-4.txt      <- whatever you want the caption to say
```

Without one, the filename becomes the caption — `kitchen-reno-day-4.mp4` posts as
"kitchen reno day 4".

## A few things worth knowing

- **Posted videos stay here.** Nothing is moved or deleted. What stops a video going up
  twice is the record in `post-log/`, not where the file sits — so leave that folder alone.
- **A video only goes once.** Editing the file afterwards doesn't send it again. Save it
  under a new name and it goes out that evening.
- **`.mp4` only.** Anything else in this folder is ignored, including this page.
- **If TikTok refuses a video**, that is written down in `post-log/` with the reason, and
  it is not tried again. Fix the file, rename it, drop it back in.
