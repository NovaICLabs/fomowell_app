export function truncateString(str = '', max = 10) {
  if (str.length <= max)
    return str
  const front = str.slice(0, 5)
  const end = str.slice(-5)
  return `${front}...${end}`
}
