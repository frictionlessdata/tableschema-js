const tv4 = require('tv4')


// Module API

class Profile {

  // Public

  static async load(profile) {
    return new Profile(profile)
  }

  get name() {
    if (!this._jsonschema.title) return null
    return this._jsonschema.title.replace(' ', '-').toLowerCase()
  }

  get jsonschema() {
    return this._jsonschema
  }

  validate(descriptor) {
    const validation = tv4.validateMultiple(descriptor, this._jsonschema)
    if (!validation.valid) {
      const errors = []
      for (const error of validation.errors) {
        errors.push(new Error(
          `Descriptor validation error:
          ${error.message}
          at "${error.dataPath}" in descriptor and
          at "${error.schemaPath}" in profile`))
      }
      throw errors
    }
    // TODO: add additional Table Schema checks from `validate`
    return true
  }

  // Private

  constructor(profile) {
    this._profile = profile
    try {
      this._jsonschema = require(`./profiles/${profile}.json`)
    } catch (error) {
      throw new Error(`Can't load profile "${profile}"`)
    }
  }

}


module.exports = {
  Profile,
}
