const validateEnvironmentVariable = require('../schema/schema').environmentVariable;

/**
 * Describes and environment variable.
 */
export default class EnvironmentVariable {
  _name: string;
  _type: any;
  _pattern: string;
  _enum: string[];
  _required: boolean;
  _default: any;
  _help: string;

  /**
   * Builds an {@link EnvironmentVariable}.
   *
   * @param {String} name The given name
   * @param {Object} rawEnvironment The given raw data
   */
  constructor(name, rawEnvironment) {
    const isValid = validateEnvironmentVariable(rawEnvironment);
    if (!isValid.valid) {
      isValid.text = isValid.text.replace(/data/g, `environment.${name}`);
      throw isValid;
    }
    this._name = name;
    this._type = rawEnvironment.type;
    this._pattern = rawEnvironment.pattern || null;
    this._required = rawEnvironment.required || false;
    this._default = rawEnvironment.default || null;
    this._help = rawEnvironment.help || null;
  }

  /**
   * Get's the name of this {@link EnvironmentVariable}.
   *
   * @return {String} The name of this {@link EnvironmentVariable}
   */
  get name() {
    return this._name;
  }

  /**
   * Get's the type of this {@link EnvironmentVariable}.
   *
   * @return {String} The type
   */
  get type() {
    return this._type;
  }

  /**
   * Get's the pattern of this {@link EnvironmentVariable}.
   *
   * @return {String} The pattern
   */
  get pattern() {
    return this._pattern;
  }

  /**
   * Checks if this {@link EnvironmentVariable} is required
   *
   * @return {Boolean} True if required, otherwise false
   */
  isRequired() {
    return this._required;
  }

  /**
   * Get the default value for this {@link EnvironmentVariable}.
   *
   * @return {*|null} The default value
   */
  get default() {
    return this._default;
  }

  /**
   * Get the help string for this {@link EnvironmentVariable}.
   *
   * @return {String|null} The help
   */
  get help() {
    return this._help;
  }
}
