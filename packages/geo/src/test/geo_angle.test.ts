import {
  deg2Rad,
  getSweepAngle,
  getTransformAngle,
  normalizeDegree,
  normalizeRadian,
  rad2Deg,
} from '../geo';

test('rad2Deg', () => {
  expect(rad2Deg(Math.PI)).toBe(180);
  expect(rad2Deg(Math.PI + Math.PI / 4)).toBe(225);
});

test('deg2Rad', () => {
  expect(deg2Rad(180)).toBe(Math.PI);
});

test('normalizeRadian', () => {
  const DOUBLE_PI = Math.PI * 2;
  const precision = 10;

  expect(normalizeRadian(DOUBLE_PI + Math.PI / 3)).toBeCloseTo(
    Math.PI / 3,
    precision,
  );
  expect(normalizeRadian(DOUBLE_PI * 20 + Math.PI / 3)).toBeCloseTo(
    Math.PI / 3,
    precision,
  );
  expect(normalizeRadian(-Math.PI / 3)).toBeCloseTo(
    Math.PI + (Math.PI * 2) / 3,
    precision,
  );
  expect(normalizeRadian(-Math.PI / 3 - DOUBLE_PI * 20)).toBeCloseTo(
    Math.PI + (Math.PI * 2) / 3,
    precision,
  );
});

test('normalizeDegree', () => {
  expect(normalizeDegree(360 + 14)).toBe(14);
  expect(normalizeDegree(360 * 10 + 14)).toBe(14);
  expect(normalizeDegree(-23)).toBe(360 - 23);
  expect(normalizeDegree(-23 - 360 * 40)).toBe(360 - 23);
});

test('getSweepAngle', () => {
  const precision = 10;

  expect(getSweepAngle({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
    Math.PI / 2,
    precision,
  );
  expect(getSweepAngle({ x: 1, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(
    Math.PI / 4,
    precision,
  );
});

test('getTransformAngle', () => {
  expect(getTransformAngle([1, 0, 0, 1, 0, 0])).toBe(0);
  expect(getTransformAngle([1, 0, 0, 1, 100, 100])).toBe(0);

  const precision = 10;

  const angle = Math.PI / 4;
  expect(
    getTransformAngle([
      Math.cos(angle),
      Math.sin(angle),
      -Math.sin(angle),
      Math.cos(angle),
      0,
      0,
    ]),
  ).toBeCloseTo(angle, precision);
  expect(
    getTransformAngle([
      Math.cos(angle),
      Math.sin(angle),
      -Math.sin(angle),
      Math.cos(angle),
      100,
      100,
    ]),
  ).toBeCloseTo(angle, precision);

  const angle2 = Math.PI / 7;
  expect(
    getTransformAngle([
      Math.cos(angle2),
      Math.sin(angle2),
      -Math.sin(angle2),
      Math.cos(angle2),
      0,
      0,
    ]),
  ).toBeCloseTo(angle2, precision);
});

// test('checkTransformFlip', () => {

// })
