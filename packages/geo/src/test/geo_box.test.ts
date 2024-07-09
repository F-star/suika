import {
  calcRectBbox,
  getPointsBbox,
  isBoxContain,
  isBoxIntersect,
  mergeBoxes,
} from '../geo';

describe('Geo Box Test', () => {
  test('mergeBoxes', () => {
    expect(
      mergeBoxes([
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
      ]),
    ).toEqual({
      minX: 0,
      minY: 0,
      maxX: 150,
      maxY: 150,
    });
  });

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

    expect(
      isBoxIntersect(
        {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100,
        },
        {
          minX: 100,
          minY: 100,
          maxX: 150,
          maxY: 150,
        },
      ),
    ).toBe(true);
  });

  test('isBoxContain', () => {
    expect(
      isBoxContain(
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
    ).toBe(false);

    expect(
      isBoxContain(
        {
          minX: 0,
          minY: 0,
          maxX: 160,
          maxY: 160,
        },
        {
          minX: 50,
          minY: 50,
          maxX: 150,
          maxY: 150,
        },
      ),
    ).toBe(true);

    // edge case
    expect(
      isBoxContain(
        {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100,
        },
        {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100,
        },
      ),
    ).toBe(true);
  });

  test('getPointsBbox', () => {
    expect(
      getPointsBbox([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 20 },
      ]),
    ).toEqual({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 50,
    });
  });

  test('calcRectBbox', () => {
    expect(
      calcRectBbox({
        width: 100,
        height: 50,
        transform: [1, 0, 0, 1, 100, 100],
      }),
    ).toEqual({
      minX: 100,
      minY: 100,
      maxX: 200,
      maxY: 150,
    });
  });
});
