import { isPointInRect } from '../geo';

test('isPointInRect', () => {
  expect(
    isPointInRect(
      { x: 50, y: 50 },
      { width: 100, height: 100, transform: [1, 0, 0, 1, 10, 10] },
    ),
  ).toBe(true);
});
