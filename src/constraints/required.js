// Module API

export function checkRequired(constraint, value) {
  if (!(constraint && (value === null || value === undefined))) {
    return true
  }
  return false
}
