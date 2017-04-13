// Module API

export function checkEnum(constraint, value) {
  if (value === null) {
    return true
  }
  if (constraint.includes(value)) {
    return true
  }
  return false
}
