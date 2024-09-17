import { isPointInRoundRect, isPointInTransformedRect } from '../geo';

test('isPointInTransformedRect', () => {
  expect(
    isPointInTransformedRect(
      { x: 50, y: 50 },
      { width: 100, height: 100, transform: [1, 0, 0, 1, 10, 10] },
    ),
  ).toBe(true);
});

test('isPointInRoundRect', () => {
  const rect = { x: 0, y: 0, width: 100, height: 100 };
  const cornerRadii = [10, 10, 10, 10];
  expect(isPointInRoundRect({ x: 50, y: 50 }, rect, cornerRadii)).toBe(true);
  expect(isPointInRoundRect({ x: 9, y: 9 }, rect, cornerRadii)).toBe(true);
  expect(isPointInRoundRect({ x: 1, y: 1 }, rect, cornerRadii)).toBe(false);
  expect(isPointInRoundRect({ x: 50, y: 0 }, rect, cornerRadii)).toBe(true); // edge
});
