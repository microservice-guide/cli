import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yamljs';
import * as utils from '../utils';
import ora from '../ora';
import Microservice from '../models/Microservice';
import Build from '../commands/Build';
import Exec from '../commands/Exec';
import Subscribe from '../commands/Subscribe';
const homedir = require('os').homedir();

/**
 * Describes the cli.
 */
export default class Cli {
  _microservice: Microservice;
  _exec: Exec;
  _subscribe: Subscribe;

  /**
   * Build an {@link Cli}.
   */
  constructor() {
    if (!fs.existsSync(path.join(process.cwd(), 'microservice.yml')) || !fs.existsSync(path.join(process.cwd(), 'Dockerfile'))) {
      utils.error('Must be ran in a directory with a `Dockerfile` and a `microservice.yml`');
      process.exit(1);
    }
    this._microservice = null;
    this._exec = null;
    this._subscribe = null;
  }

  /**
   * Builds a {@link Microservice} based ton the `microservice.yml` file. If the build throws an error the user
   * will be directed to run `omg validate`.
   */
  buildMicroservice() {
    try {
      const json = YAML.parse(fs.readFileSync(path.join(process.cwd(), 'microservice.yml')).toString());
      this._microservice = new Microservice(json);
    } catch (e) {
      utils.error('Unable to build microservice. Run `omg validate` for more details');
      process.exit(1);
    }
  }

  /**
   * Formats the output based on the data and options.
   *
   * @param {Object} data The given data of the validation
   * @param {Object} options The given options (json, silent, or text)
   * @return {String} The string to be printed to the console
   */
  static _processValidateOutput(data, options) {
    if (options.json) {
      return JSON.stringify(data, null, 2);
    } else if (options.silent) {
      return '';
    } else {
      if (!data.text) {
        return `${data.context} has an issue. ${data.message}`;
      } else {
        return data.text;
      }
    }
  }

  /**
   * Reads the `microservice.yml` and validates it.
   *
   * @param {Object} options The given options (json, silent, or text)
   */
  static validate(options) {
    const json = YAML.parse(fs.readFileSync(path.join(process.cwd(), 'microservice.yml')).toString());
    try {
      const m = new Microservice(json);
      utils.log(Cli._processValidateOutput(m.rawData, options));
      process.exit(0);
    } catch (e) {
      utils.error(Cli._processValidateOutput(e, options));
      process.exit(1);
    }
  }

  /**
   * Builds a microservice based off of the Dockerfile in the current directory.
   *
   * @param {Object} options The given name
   */
  static async build(options) {
    try {
      await new Build(options.tag || await utils.createImageName()).go();
    } catch (e) {
      utils.error('The tag flag must be provided because no git config is present. Example: `omg build -t omg/my/service`');
      process.exit(1);
    }
  }

  /**
   * Will read the `microservice.yml` and `Dockerfile` and run the given command with the given arguments and environment variables.
   *
   * @param {String} action The command to run
   * @param {Object} options The given object holding the command, arguments, and environment variables
   */
  async exec(action, options) {
    const image = options.image;
    if (!(options.args) || !(options.envs)) {
      utils.error('Failed to parse command, run `omg exec --help` for more information.');
      process.exit(1);
      return;
    }

    if (options.image) {
      const images = await utils.exec(`docker images -f "reference=${image}"`);
      if (!images.includes(options.image)) {
        utils.error(`Image for microservice is not built. Run \`omg build\` to build the image.`);
        process.exit(1);
        return;
      }
    } else {
      await Cli.build({});
      options.image = await utils.createImageName();
    }

    try {
      const argsObj = utils.parse(options.args, 'Unable to parse arguments. Must be of form: `-a key="val"`');
      const envObj = utils.parse(options.envs, 'Unable to parse environment variables. Must be of form: `-e key="val"`');
      this._exec = new Exec(`${options.image}`, this._microservice, argsObj, envObj);
      await this._exec.go(action);
    } catch (error) {
      if (error.spinner) {
        if (error.message.includes('Unable to find image')) {
          error.spinner.fail(`${error.message.split('.')[0]}. Container not built. Run \`omg build \`container_name\`\``);
        } else {
          error.spinner.fail(error.message);
        }
      } else {
        process.stderr.write(error.message);
      }
      process.exit(1);
    }
  }

  /**
   * Will read the `microservice.yml` and `Dockerfile` and subscribe to the with the given event..
   *
   * @param {String} event The given event
   * @param {Object} options The given object holding the arguments
   */
  async subscribe(event, options) {
    try {
      const argsObj = utils.parse(options.args, 'Unable to parse arguments. Must be of form: `-a key="val"`');
      this._subscribe = new Subscribe(this._microservice, argsObj);
      await this._subscribe.go(event);
    } catch (error) {
      if (error.spinner) {
        if (error.message.includes('Unable to find image')) {
          error.spinner.fail(`${error.message.split('.')[0]}. Container not built. Run \`omg build \`container_name\`\``);
        } else {
          error.spinner.fail(error.message);
        }
      } else {
        process.stderr.write(error.message);
      }
      process.exit(1);
    }
  }

  /**
   * Kills a docker process that is associated with the microservice.
   */
  static async shutdown() {
    const spinner = ora.start('Shutting down microservice');
    const infoMessage = 'Microservice not shutdown because it was not running';
    if (!fs.existsSync(`${homedir}/.omg.json`)) {
      spinner.info(infoMessage);
    }

    const omgJson = JSON.parse(fs.readFileSync(`${homedir}/.omg.json`, 'utf8'));
    if (omgJson[process.cwd()]) {
      const containerId = omgJson[process.cwd()].container_id;
      await utils.exec(`docker kill ${containerId}`);
      delete omgJson[process.cwd()];
      fs.writeFileSync(`${homedir}/.omg.json`, JSON.stringify(omgJson), 'utf8');
      spinner.succeed(`Microservice with container id: \`${containerId.substring(0, 12)}\` successfully shutdown`);
    } else {
      spinner.info(infoMessage);
    }
  }

  /**
   * Catch the `CtrlC` command to stop running containers.
   */
  async controlC() {
    if (this._exec && this._exec.isDockerProcessRunning()) {
      await this._exec.serverKill();
    }
    if (this._subscribe) {
      await this._subscribe.unsubscribe();
    }
    process.exit();
  }
}
