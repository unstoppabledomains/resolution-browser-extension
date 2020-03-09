const rules = {
    segmentMinLength: 2,
    labelLength: 63,
    domainLength: 253,
    domainSegment: /^[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/,
    tldSegment: /^[a-zA-Z](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/,
}

export default function isValidDNSHostname(hostname: string) {
  if(!hostname || hostname.length > rules.domainLength) return false;
  const labels = hostname.split('.');
  if (labels.length < rules.segmentMinLength) {
      return false;
  }
  return labels.every((label,i) => {
    if(i < labels.length - 1) {
      return rules.domainSegment.test(label) && label.length <= rules.labelLength;
    }
    return rules.tldSegment.test(label);
  })
}
