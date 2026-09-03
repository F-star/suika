// Type definitions for PathKit.
//
// The JS surface is assembled from three places: the embind bindings in
// pathkit_wasm_bindings.cpp, plus helper.js and chaining.js which are baked in as --pre-js.

export interface PathKitInitOptions {
  /** Maps an emscripten-requested filename (e.g. "pathkit.wasm") to a URL or path. */
  locateFile?: (file: string, scriptDirectory: string) => string;
  /** Preloaded wasm bytes, as an alternative to fetching via locateFile. */
  wasmBinary?: ArrayBuffer | Uint8Array;
  instantiateWasm?: (
    imports: WebAssembly.Imports,
    successCallback: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
  ) => WebAssembly.Exports | undefined;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
}

declare const EMBIND_ENUM: unique symbol;

/**
 * A value from one of PathKit's embind enums. Compare with `.value`, not by identity.
 *
 * `TName` exists only to keep the enums apart at compile time: every entry is `{value: number}`
 * at runtime, so without it a PathOp would be accepted anywhere a StrokeJoin is expected. The
 * branded field is never present at runtime, which is also why these cannot be constructed —
 * they only ever come from the PathKit instance.
 */
export interface EmbindEnum<TName extends string> {
  readonly value: number;
  readonly [EMBIND_ENUM]: TName;
}

export type PathOp = EmbindEnum<'PathOp'>;
export type FillType = EmbindEnum<'FillType'>;
export type StrokeJoin = EmbindEnum<'StrokeJoin'>;
export type StrokeCap = EmbindEnum<'StrokeCap'>;

export interface PathOpEnumValues {
  readonly DIFFERENCE: PathOp;
  readonly INTERSECT: PathOp;
  readonly UNION: PathOp;
  readonly XOR: PathOp;
  readonly REVERSE_DIFFERENCE: PathOp;
}

export interface FillTypeEnumValues {
  readonly WINDING: FillType;
  readonly EVENODD: FillType;
  readonly INVERSE_WINDING: FillType;
  readonly INVERSE_EVENODD: FillType;
}

export interface StrokeJoinEnumValues {
  readonly MITER: StrokeJoin;
  readonly ROUND: StrokeJoin;
  readonly BEVEL: StrokeJoin;
}

export interface StrokeCapEnumValues {
  readonly BUTT: StrokeCap;
  readonly ROUND: StrokeCap;
  readonly SQUARE: StrokeCap;
}

export interface StrokeOpts {
  /** Stroke width. Defaults to 1. */
  width?: number;
  /** Miter limit, only used with a MITER join. Defaults to 4. */
  miter_limit?: number;
  /** Precision hint for curve flattening; higher means finer. Defaults to 1. */
  res_scale?: number;
  /** Defaults to StrokeJoin.MITER. */
  join?: StrokeJoin;
  /** Defaults to StrokeCap.BUTT. */
  cap?: StrokeCap;
}

export interface SkRect {
  fLeft: number;
  fTop: number;
  fRight: number;
  fBottom: number;
}

/** [x, y]. */
export type SkPoint = [number, number];

/** A 3x3 matrix in row-major order. */
export type SkMatrix = [number, number, number, number, number, number, number, number, number];

/** One verb and its arguments, e.g. [MOVE_VERB, x, y] or [CUBIC_VERB, x1, y1, ..., y3]. */
export type Cmd = number[];

/**
 * Commands accepted by FromCmds. Numbers may also be hex-float strings like "0x43b40000", which
 * is how the PathOps test corpora record exact bit patterns.
 */
export type CmdInput = ReadonlyArray<ReadonlyArray<number | string>>;

/** The two fill rules SVG and Canvas understand. Inverse fill types report "nonzero". */
export type FillRuleString = 'nonzero' | 'evenodd';

/**
 * A mutable path. Backed by an SkPathBuilder in C++.
 *
 * These are WASM heap objects: call `delete()` when finished, or they leak. Methods that only
 * build geometry return `this` so they can be chained; methods that can fail return `this` on
 * success and `null` on failure, leaving the path untouched.
 */
export interface SkPath {
  // --- Path2D-compatible building. These cannot fail. ---
  addPath(other: SkPath): SkPath;
  addPath(other: SkPath, transform: DOMMatrixReadOnly): SkPath;
  addPath(
    other: SkPath,
    scaleX: number, skewX: number, transX: number,
    skewY: number, scaleY: number, transY: number,
  ): SkPath;
  addPath(
    other: SkPath,
    scaleX: number, skewX: number, transX: number,
    skewY: number, scaleY: number, transY: number,
    pers0: number, pers1: number, pers2: number,
  ): SkPath;
  reverseAddPath(other: SkPath): SkPath;

  arc(
    x: number, y: number, radius: number,
    startAngle: number, endAngle: number, ccw?: boolean,
  ): SkPath;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): SkPath;
  ellipse(
    x: number, y: number, radiusX: number, radiusY: number,
    rotation: number, startAngle: number, endAngle: number, ccw?: boolean,
  ): SkPath;
  rect(x: number, y: number, width: number, height: number): SkPath;

  moveTo(x: number, y: number): SkPath;
  lineTo(x: number, y: number): SkPath;
  quadTo(cpx: number, cpy: number, x: number, y: number): SkPath;
  /** Alias for quadTo. */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): SkPath;
  conicTo(x1: number, y1: number, x2: number, y2: number, w: number): SkPath;
  cubicTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): SkPath;
  /** Alias for cubicTo. */
  bezierCurveTo(
    cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number,
  ): SkPath;
  close(): SkPath;
  /** Alias for close. */
  closePath(): SkPath;

  transform(matrix: SkMatrix): SkPath;
  transform(
    scaleX: number, skewX: number, transX: number,
    skewY: number, scaleY: number, transY: number,
    pers0: number, pers1: number, pers2: number,
  ): SkPath;

  // --- Queries ---
  isEmpty(): boolean;
  equals(other: SkPath): boolean;
  /** A new path with the same geometry. The caller owns it and must delete() it. */
  copy(): SkPath;
  getBounds(): SkRect;
  /** Bounds of the curves themselves, rather than of their control points. */
  computeTightBounds(): SkRect;
  getFillType(): FillType;
  setFillType(fillType: FillType): void;
  getFillTypeString(): FillRuleString;

  // --- Path effects. Return null if the effect could not be applied. ---
  /** Replaces the path with a dashed version of it. */
  dash(on: number, off: number, phase: number): SkPath | null;
  /** Keeps the portion of the path between startT and stopT, both in [0, 1]. */
  trim(startT: number, stopT: number, isComplement?: boolean): SkPath | null;
  /** Replaces the path with the filled outline of stroking it. Null if the result is a hairline. */
  stroke(opts?: StrokeOpts): SkPath | null;

  // --- Path ops. Return null if the operation failed, leaving the path unchanged. ---
  /** Combines this path with `other`, in place. */
  op(other: SkPath, op: PathOp): SkPath | null;
  /** Resolves self-intersections and normalizes the fill type, in place. */
  simplify(): SkPath | null;
  /** Rewrites the path to use a winding fill type without changing the filled region. */
  asWinding(): SkPath | null;

  // --- Export ---
  toCmds(): Cmd[];
  toSVGString(): string;
  toPath2D(): Path2D;
  /** Replays the path onto anything with the CanvasRenderingContext2D path methods. */
  toCanvas(ctx: CanvasRenderingContext2D | Path2D): void;

  /** Frees the underlying WASM memory. The object is unusable afterwards. */
  delete(): void;
}

export interface SkOpBuilder {
  add(path: SkPath, op: PathOp): void;
  /** Alias for resolve. */
  make(): SkPath | null;
  /** The combined path, or null if the ops could not be resolved. Caller owns the result. */
  resolve(): SkPath | null;
  delete(): void;
}

export interface SkPathConstructor {
  new (): SkPath;
  new (other: SkPath): SkPath;
  readonly prototype: SkPath;
}

export interface SkOpBuilderConstructor {
  new (): SkOpBuilder;
  readonly prototype: SkOpBuilder;
}

export interface PathKit {
  readonly SkPath: SkPathConstructor;
  readonly SkOpBuilder: SkOpBuilderConstructor;

  /** A new empty path, or a copy of `other`. */
  NewPath(other?: SkPath): SkPath;
  /** Parses an SVG path "d" attribute. Null if it could not be parsed. */
  FromSVGString(d: string): SkPath | null;
  /** Builds a path from verb arrays. Null if the commands are malformed. */
  FromCmds(cmds: CmdInput): SkPath | null;
  /** Combines two paths without mutating either. Null if the operation failed. */
  MakeFromOp(one: SkPath, two: SkPath, op: PathOp): SkPath | null;

  /** Evaluates the cubic bezier (0,0)-(cpx1,cpy1)-(cpx2,cpy2)-(1,1) at x. */
  cubicYFromX(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number): number;
  /** Evaluates the same cubic at parameter t. */
  cubicPtFromT(cpx1: number, cpy1: number, cpx2: number, cpy2: number, t: number): SkPoint;

  LTRBRect(left: number, top: number, right: number, bottom: number): SkRect;

  readonly PathOp: PathOpEnumValues;
  readonly FillType: FillTypeEnumValues;
  readonly StrokeJoin: StrokeJoinEnumValues;
  readonly StrokeCap: StrokeCapEnumValues;

  readonly MOVE_VERB: number;
  readonly LINE_VERB: number;
  readonly QUAD_VERB: number;
  readonly CONIC_VERB: number;
  readonly CUBIC_VERB: number;
  readonly CLOSE_VERB: number;

  /** Reinterprets an unsigned int as a float, for tests that need exact bit patterns. */
  SkBits2FloatUnsigned(floatAsBits: number): number;
}

declare function PathKitInit(opts?: PathKitInitOptions): Promise<PathKit>;

export default PathKitInit;
