/** get a random color based on id */
export const getRandomColor = (id: string) => {
  if (!id) return '#000000';

  let hash = id.split('').reduce((acc, char, index) => {
    const code = char.charCodeAt(0);
    return (
      code +
      ((acc << 11) - acc) +
      index * 17 +
      code * 19927 +
      (acc >> 3) * 23917
    );
  }, 47);
  hash = Math.abs(hash);

  const r = ((hash & 0xff) * 16127 + hash * 31) % 256;
  const g = (((hash >> 5) & 0xff) * 14731 + hash * 37) % 256;
  const b = (((hash >> 11) & 0xff) * 13463 + hash * 41) % 256;

  const color = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  return `#${color}`;
};
