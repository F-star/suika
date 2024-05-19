import { isPointInPolygon } from '../geo';

describe('geo polygon', () => {
  test('isPointInPolygon', () => {
    const polygon = [
      {
        x: 0,
        y: 2,
      },
      {
        x: 0,
        y: 9,
      },
      {
        x: 12,
        y: 9,
      },
      {
        x: 12,
        y: 0,
      },
      {
        x: 5,
        y: 5,
      },
    ];

    expect(isPointInPolygon(polygon, { x: 4, y: 7 })).toBe(true);
    expect(isPointInPolygon(polygon, { x: 1, y: 4 })).toBe(true);
    expect(isPointInPolygon(polygon, { x: 9, y: 3 })).toBe(true);

    expect(isPointInPolygon(polygon, { x: 5, y: 2 })).toBe(false);
    expect(isPointInPolygon(polygon, { x: -2, y: 5 })).toBe(false);
    expect(isPointInPolygon(polygon, { x: -2, y: 9 })).toBe(false);
    expect(isPointInPolygon(polygon, { x: 14, y: 5 })).toBe(false);

    // point in edge point
    expect(isPointInPolygon(polygon, { x: 6, y: 5 })).toBe(true);
  });

  test('isPointInPolygon 2', () => {
    const polygon = [
      {
        x: 4,
        y: 0,
      },
      {
        x: 0,
        y: 4,
      },
      {
        x: 4,
        y: 9,
      },
      {
        x: 9,
        y: 5,
      },
    ];
    expect(isPointInPolygon(polygon, { x: 5, y: 5 })).toBe(true);
    expect(isPointInPolygon(polygon, { x: 2, y: 0 })).toBe(false);
    expect(isPointInPolygon(polygon, { x: -2, y: 4 })).toBe(false);

    // point in edge
    expect(isPointInPolygon(polygon, { x: 6, y: 2 })).toBe(true);
  });
});
