export function invert(object) {
  const returnee = {};

  for (const key in object) {
    if(!object.hasOwnProperty(key)) continue;
    returnee[object[key]] = key;
  }
  return returnee;
}