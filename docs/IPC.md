# IPC Communication Guide

All channels are invoked from the renderer via `window.electronAPI`.

## Tasks

| Channel | Args | Returns |
|---------|------|---------|
| `tasks:getAll` | `userId?` | `TaskRow[]` |
| `tasks:create` | `task` | `TaskRow` |
| `tasks:update` | `{ id, ...fields }` | `TaskRow` |
| `tasks:delete` | `id` | `{ success }` |

## Sessions

| Channel | Args | Returns |
|---------|------|---------|
| `sessions:start` | `SessionStartConfig` | `SessionRow` |
| `sessions:pause` | `{ id, pauses? }` | `SessionRow` |
| `sessions:resume` | `{ id }` | `SessionRow` |
| `sessions:complete` | `SessionCompletePayload` | `SessionCompleteResult` |
| `sessions:getHistory` | `{ limit? }` | `SessionRow[]` |

## Analytics

| Channel | Returns |
|---------|---------|
| `analytics:getDashboard` | Dashboard stats |
| `analytics:getWeeklyStats` | 7-day chart data |
| `analytics:getHeatmap` | Hourly + music stats |
| `analytics:getMonthly` | Monthly aggregates |

## Settings & music

| Channel | Purpose |
|---------|---------|
| `settings:get` / `settings:update` | User preferences |
| `music:getLibrary` | Melody Wings track list |
| `music:toggleFavorite` | Favorite a track |
| `notifications:show` | Native OS notification |
| `quotes:getRandom` | Motivational quote |
