import lodash from 'lodash'
import moment from 'moment'
import {timeParse} from 'd3-time-format'
import {ERROR} from '../config'


// Module API

export function castDate(format, value) {
  if (!lodash.isDate(value)) {
    if (!lodash.isString(value)) {
      return ERROR
    }
    try {
      if (format === 'default') {
        value = moment(timeParse(_DEFAULT_PATTERN)(value))
      } else if (format === 'any') {
        value = moment(value)
      } else {
        if (format.startsWith('fmt:')) {
          console.warn(
            `Format "fmt:<PATTERN>" is deprecated.
             Please use "<PATTERN>" without "fmt:" prefix.`)
          format = format.replace('fmt:', '')
        }
        value = moment(timeParse(format)(value))
      }
      if (!value.isValid()) {
        return ERROR
      }
      value = value.toDate()
    } catch (error) {
      return ERROR
    }
  }
  return value
}


// Internal

const _DEFAULT_PATTERN = '%Y-%m-%d'
