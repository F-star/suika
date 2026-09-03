import PathKitInit, {
  type PathKit,
  type SkPath,
  type StrokeOpts,
} from '@suika/pathkit';
import pathKitWasmUrl from '@suika/pathkit/pathkit.wasm?url';

export type OffsetPathOptions = Omit<StrokeOpts, 'width'>;

export const initPathKit = async () => {
  const PathKit = await PathKitInit({ locateFile: () => pathKitWasmUrl });
  return PathKit;
};

/**
 * Offsets the filled region represented by `skPath`.
 *
 * A positive distance expands the region and a negative distance contracts it.
 * The returned path is a new WASM object owned by the caller; `skPath` is never
 * mutated. Returns `null` when PathKit cannot create the stroke or apply the
 * boolean operation.
 */
export const offsetPath = (
  skPath: SkPath,
  distance: number,
  pathKit: PathKit,
  options: OffsetPathOptions = {},
): SkPath | null => {
  if (!Number.isFinite(distance)) {
    throw new RangeError('offsetPath distance must be a finite number');
  }

  const result = skPath.copy();

  if (distance === 0 || skPath.isEmpty()) {
    return result;
  }

  const stroke = skPath.copy();
  try {
    const stroked = stroke.stroke({
      ...options,
      width: Math.abs(distance) * 2,
    });

    if (!stroked) {
      result.delete();
      return null;
    }

    const operation =
      distance > 0 ? pathKit.PathOp.UNION : pathKit.PathOp.DIFFERENCE;

    if (!result.op(stroke, operation)) {
      result.delete();
      return null;
    }

    return result;
  } catch (error) {
    result.delete();
    throw error;
  } finally {
    stroke.delete();
  }
};
