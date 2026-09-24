/** Minimal class name joiner — avoids pulling in clsx for one function. */
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ');
}
