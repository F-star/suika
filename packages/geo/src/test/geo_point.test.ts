import {
  distance,
  getMidPoint,
  isPointEqual,
  lerp,
  linearInterpolate,
  pointAdd,
} from '../geo';

test('getMidPoint', () => {
  expect(
    getMidPoint(
      {
        x: 0,
        y: 0,
      },
      {
        x: 100,
        y: 80,
      },
    ),
  ).toEqual({ x: 50, y: 40 });
});

test('pointAdd', () => {
  expect(
    pointAdd(
      {
        x: 1,
        y: 10,
      },
      {
        x: 100,
        y: 80,
      },
    ),
  ).toEqual({ x: 101, y: 90 });
});

test('isPointEqual', () => {
  expect(
    isPointEqual(
      {
        x: 1,
        y: 10,
      },
      {
        x: 1,
        y: 10,
      },
    ),
  ).toBe(true);

  expect(
    isPointEqual(
      {
        x: 1,
        y: 10,
      },
      {
        x: 1.0001,
        y: 10,
      },
      0.001,
    ),
  ).toBe(true);
});

test('distance', () => {
  expect(
    distance(
      {
        x: 0,
        y: 3,
      },
      {
        x: 4,
        y: 0,
      },
    ),
  ).toBe(5);
});

test('lerp', () => {
  expect(lerp(0, 10, 0.6)).toBe(6);
});
test('linearInterpolate', () => {
  expect(
    linearInterpolate(
      {
        x: 0,
        y: 0,
      },
      { x: 10, y: 10 },
      0.6,
    ),
  ).toEqual({ x: 6, y: 6 });
});
