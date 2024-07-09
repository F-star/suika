import { closestPtOnLine, getPolarTrackSnapPt, isPointEqual } from '../geo';

test('closestPtOnLine', () => {
  expect(
    closestPtOnLine({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 30 }),
  ).toEqual({
    point: {
      x: 5,
      y: 0,
    },
    t: 0.5,
  });

  expect(
    closestPtOnLine({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 30 }),
  ).toEqual({
    point: {
      x: 0,
      y: 0,
    },
    t: 0,
  });

  expect(
    closestPtOnLine({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 100, y: 100 }),
  ).toEqual({
    point: {
      x: 100,
      y: 0,
    },
    t: 10,
  });

  expect(
    closestPtOnLine({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 100, y: 100 }, false),
  ).toEqual({
    point: {
      x: 10,
      y: 0,
    },
    t: 1,
  });
});

test('getPolarTrackSnapPt', () => {
  const point = getPolarTrackSnapPt({ x: 0, y: 0 }, { x: 10, y: 1 }, 4);
  console.log(point);
  expect(
    isPointEqual(point, {
      x: 10,
      y: 0,
    }),
  ).toBe(true);

  const point2 = getPolarTrackSnapPt({ x: 0, y: 0 }, { x: 1, y: 10 }, 4);
  expect(
    isPointEqual(point2, {
      x: 0,
      y: 10,
    }),
  ).toBe(true);
});
