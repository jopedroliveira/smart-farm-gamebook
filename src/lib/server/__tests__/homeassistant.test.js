import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { lastWatering, litresFor, VALVE_ENTITIES } from '../homeassistant.js';

const now = new Date('2026-10-23T12:00:00Z');
const valve = [
  { state: 'off', last_changed: '2026-10-20T06:00:00Z' },
  { state: 'on', last_changed: '2026-10-22T06:00:00Z' },
  { state: 'off', last_changed: '2026-10-22T06:12:00Z' },
  { state: 'on', last_changed: '2026-10-23T06:00:00Z' },
  { state: 'off', last_changed: '2026-10-23T06:10:00Z' },
];

describe('lastWatering', () => {
  it('finds the most recent on/off pair and its duration', () => {
    expect(lastWatering(valve, now)).toEqual({ ultimaRega: '2026-10-23T06:00:00.000Z', duracaoMin: 10, horasDesdeRega: 6 });
  });

  it('skips a window that is still open or absurdly long', () => {
    const open = [...valve, { state: 'on', last_changed: '2026-10-23T11:00:00Z' }];
    expect(lastWatering(open, now).ultimaRega).toBe('2026-10-23T06:00:00.000Z');
    const long = [{ state: 'on', last_changed: '2026-10-20T06:00:00Z' }, { state: 'off', last_changed: '2026-10-20T12:00:00Z' }];
    expect(lastWatering(long, now)).toEqual({ ultimaRega: null, duracaoMin: null, horasDesdeRega: null });
    expect(lastWatering(undefined, now).ultimaRega).toBeNull();
  });
});

describe('litresFor', () => {
  const flow = [
    { state: '0', last_changed: '2026-10-23T05:00:00Z', attributes: { unit_of_measurement: 'm³/h' } },
    { state: '0.24', last_changed: '2026-10-23T06:01:00Z', attributes: { unit_of_measurement: 'm³/h' } },
    { state: '0.30', last_changed: '2026-10-23T06:05:00Z', attributes: { unit_of_measurement: 'm³/h' } },
    { state: '0', last_changed: '2026-10-23T06:11:00Z', attributes: { unit_of_measurement: 'm³/h' } },
  ];

  it('averages the flow samples inside the watering window, in litres', () => {
    // mean of 0.24 and 0.30 m3/h over 10 min = 0.27 * 1000 / 6 = 45 L
    expect(litresFor(flow, '2026-10-23T06:00:00.000Z', 10)).toBe(45);
  });

  it('handles L/min and returns null without samples', () => {
    const lmin = [{ state: '4', last_changed: '2026-10-23T06:03:00Z', attributes: { unit_of_measurement: 'L/min' } }];
    expect(litresFor(lmin, '2026-10-23T06:00:00.000Z', 10)).toBe(40);
    expect(litresFor(flow, '2026-10-22T06:00:00.000Z', 12)).toBeNull();
    expect(litresFor(undefined, '2026-10-22T06:00:00.000Z', 12)).toBeNull();
  });
});

describe('VALVE_ENTITIES', () => {
  it('covers all six beds', () => {
    expect(Object.keys(VALVE_ENTITIES).sort()).toEqual(['RB-11', 'RB-12', 'RB-13', 'RB-21', 'RB-22', 'RB-23']);
    expect(VALVE_ENTITIES['RB-22']).toBe('switch.sonoff_swv_rb_22');
  });
});
