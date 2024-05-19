import { isBoxIntersect } from '../geo';

test('isBoxIntersect', () => {
  expect(
    isBoxIntersect(
      {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      },
      {
        minX: 50,
        minY: 50,
        maxX: 150,
        maxY: 150,
      },
    ),
  ).toBe(true);
});
