import { isPointInCircle } from '../geo';

test('isPointInCircle', () => {
  expect(isPointInCircle({ x: 0, y: 0 }, { x: 0, y: 0, radius: 100 })).toEqual(
    true,
  );
});
