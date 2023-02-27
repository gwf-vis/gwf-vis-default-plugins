export function obtainObjectChangedPropertyNameSet<T = any>(
  oldObject: any,
  newObject: any
) {
  let changedProps = new Set<keyof T | string>();
  for (let key in oldObject) {
    if (!(key in newObject)) {
      changedProps.add(key);
    } else {
      if (oldObject[key] !== newObject[key]) {
        changedProps.add(key);
      }
    }
  }
  for (let key in newObject) {
    if (!(key in oldObject)) {
      changedProps.add(key);
    }
  }
  return changedProps;
}
