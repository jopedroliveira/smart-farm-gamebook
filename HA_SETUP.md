# Home Assistant Water Sensor Integration

Connects Home Assistant irrigation/flow sensors to SmartFarm so the app shows **when each raised bed was last watered**.

## How it works

1. The app **auto-discovers** HA entities by matching the bed's Notion code (e.g. `RB-11`) against entity IDs like `sensor.rb_11_flow`
2. The app polls HA every **5 minutes** via REST API
3. When a sensor reads > 0 (or is `on`), a water event is recorded
4. The UI shows:
   - A 💧 badge on the bed map (hover for relative time)
   - **"Regada"** chip in the bed info modal with exact date/time

## Setup

### 1. Environment variables

Add to your `.env` or Docker compose:

```bash
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your_long_lived_access_token
```

> Get a token from HA: **Profile → Long-Lived Access Tokens → Create Token**

### 2. Auto-discovery (recommended)

If your HA entities contain the bed code in their name (e.g. `sensor.rb_11_flow`, `switch.irrigation_rb12`), nothing else is needed — the first sync will auto-match them.

The matching is case-insensitive and ignores dashes/underscores (`RB-11` matches `rb11`, `rb_11`, etc.).

### 3. Manual mapping (optional)

If auto-discovery doesn't find a sensor, map it manually:

```bash
curl -X PATCH http://localhost:3000/api/beds/A1 \
  -H "Content-Type: application/json" \
  -d '{"haWaterEntity": "sensor.bed_a1_flow_meter"}'
```

Supported entity types:
- **Numeric sensors** (flow meters, volume): recorded when `state > 0`
- **Binary sensors / switches** (irrigation valves): recorded when `state == "on"`

### 4. Verify

Manually trigger a sync:

```bash
curl -X POST http://localhost:3000/api/sync/ha
```

Check a bed's water history:

```bash
curl "http://localhost:3000/api/beds/A1/water?days=7"
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/beds` | GET | List all beds with sensors |
| `/api/beds/:id` | GET | Bed detail + last watered |
| `/api/beds/:id` | PATCH | Update `haWaterEntity`, `notes`, `estado`, etc. |
| `/api/beds/:id/water?days=N` | GET | Water event history |
| `/api/sync/ha` | POST | Manual HA sync trigger |

## Database schema

- `beds.ha_water_entity` — HA entity_id for this bed's water sensor
- `water_events` — recorded irrigation events (`bed_id`, `timestamp`, `value`)
