/**
 * set some optional property
 *
 * @example
 * type Foo = { a: string; b: number; c: boolean };
 * type FooWithOptionalB = Optional<Foo, 'b'>;
 * // { a: string; b?: number; c: boolean }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
