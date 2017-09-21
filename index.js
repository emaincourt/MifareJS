require('babel-core/register');
require('babel-polyfill');

import console from 'better-console';
import { promisify } from 'bluebird';
import { exec } from 'child_process';
import colors from 'colors/safe';
import { readFile } from 'fs';
import { chunk } from 'lodash';
import { resolve } from 'path';

const UIDREGEXP = /([0-9a-z]{2}[ ]{2}[0-9a-z]{2}[ ]{2}[0-9a-z]{2}[ ]{2}[0-9a-z]{2})/i;

export class MifareClassic1K {
  /*
    Read Mifare Classic 1K UID
    @returns {Promise.<String, Error>}: The UID of the tag or the error that has been raised if needed
  */
  static async readUID() {
    const stdout = await promisify(exec)('nfc-list');
    const matches = stdout.match(UIDREGEXP);
    if (!matches) {
      throw new ReferenceError('No tag has been found.');
    }
    return matches[1].replace(/ /g, '');
  }
}

export default class LockSmith {
  constructor({
    keys = [],
    workspace = './',
    defaultKeysPath = 'keys.txt',
  } = {}) {
    if (!keys.reduce((acc, next) => acc && next.match(/[a-z0-9]{8}/i), true)) {
      throw new Error('Provided keys must match the right pattern.');
    }
    this.keys = keys.map(key => `-k ${key}`);
    this.workspace = workspace;
    this.defaultKeys = this.readKeysFromFile(defaultKeysPath);
  }

  /*
    Dumps the content of a Mifare tag to the filename file
    @param {String}: the name of file the dump should be written to
    @param {Array}: additional parameters that should be provided to mfoc
    @returns {Promise}
  */
  async dump(filename = './dump.mfd', ...options) {
    const keys = [
      ...(await this.defaultKeys),
      ...this.keys,
    ].join(' ');
    const path = resolve(`${this.workspace}/${filename}`);
    const params = [
      `-O ${path}`,
      keys,
      ...options,
    ];
    console.log(colors.blue('Please wait while authenticating to the tag...'));
    return this.constructor.mfoc(params);
  }

  /*
    Clones the content of source to target after both of them have been dumped
    If unlock is set to true, the sector 0 will also be written
    This option should be turned off if you're using a 2nd gen mifare
    @param {String}: source, dump of the tag to be cloned
    @param {String}: target, dump of the target tag
    @param {Boolean}: whether the sector 0 should be unlocked and written or not
    @param {Array}: additional parameters that should be provided to mfoc
    @returns {}
  */
  async clone(source, target, unlock = true) {
    const command = [
      'nfc-mfclassic',
      unlock ? 'W X' : 'w x',
      resolve(`${this.workspace}/${target}`),
      resolve(`${this.workspace}/${source}`),
    ].join(' ');
    await promisify(exec)(command, []);
    console.log(colors.green('Successfully cloned.'));
  }

  /*
    Reads the security keys from a file, matching all the strings that could match the right pattern
    @param {String}: the name of the file that contains the keys
    @param {Array}: an array containing the found keys
    @returns {}
  */
  async readKeysFromFile(filename) {
    const path = resolve(`${this.workspace}/${filename}`);
    const stdout = await promisify(readFile)(path, 'utf8');
    const matches = stdout.match(/[0-9a-z]{12}/gi);
    return matches
      ? matches.map(key => `-k ${key}`)
      : [];
  }

  /*
    Basically runs mfoc command with the provided parameters
    @param {Array}: the options that should be passed to mfoc
    @returns {Array}: The params that have been provided
  */
  static async mfoc(params) {
    await promisify(exec)(`mfoc ${params.join(' ')}`);
    return params;
  }

  /*
    Reads the Hex Data and writes it to the terminal
    @param {String}: path to the file
    @param {Boolean}: whether the content should be displayed or not
    @returns {Array}: the Hex content read from file
  */
  static async readHexFile(path, display = true) {
    const content = await promisify(readFile)(path);
    const chunks = chunk(content, 16);
    if (display) {
      console.table(chunks);
    }
    return chunks;
  }
}
