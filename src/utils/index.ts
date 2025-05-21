export function randomPriceSegment() {
  const segments = ['high', 'medium', 'low'];

  return segments[Math.floor(Math.random() * segments.length)];
}
