export default function isValidDNSHostname(hostname: string) {
  const labels = hostname.split('.')

  if (labels[labels.length - 1] === '') {
    labels.pop()
  }

  return (
    labels.every(label =>
      /^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/.test(label),
    ) && labels.reduce((a, v) => v.length + a, 0) < 253
  )
}
