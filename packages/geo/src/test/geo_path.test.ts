import { GeoBezier } from '../geo/geo_bezier_class';

test('bezier box', () => {
  const bezier = new GeoBezier([
    { x: -24, y: 156 },
    { x: -127.99999999999999, y: 156 },
    { x: -128, y: 0 },
    { x: -24, y: 0 },
  ]);

  const bbox = bezier.getBbox();
  const PRECISION = 7;
  expect(bbox.minX).toBeCloseTo(-102, PRECISION);
  expect(bbox.minY).toBeCloseTo(0, PRECISION);
  expect(bbox.maxX).toBeCloseTo(-24, PRECISION);
  expect(bbox.maxY).toBeCloseTo(156, PRECISION);
});
