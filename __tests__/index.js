import console from 'better-console';
import bluebird from 'bluebird';
import { resolve } from 'path';
import LockSmith, * as Mifare from '../index';

describe('LockSmith', () => {
  describe('#instanciation', () => {
    it('instanciates a new LockSmith without additional parameters', () => {
      expect.assertions(3);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith();
      expect(lockSmith.keys).toEqual([]);
      expect(lockSmith.workspace).toEqual('./');
      expect(mocks.readKeysFromFile).toHaveBeenCalledWith('keys.txt');
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('instanciates a new LockSmith with additional keys', () => {
      expect.assertions(3);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith({
        keys: ['00000000'],
      });
      expect(lockSmith.keys).toEqual(['-k 00000000']);
      expect(lockSmith.workspace).toEqual('./');
      expect(mocks.readKeysFromFile).toHaveBeenCalledWith('keys.txt');
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('throws an error on instanciation if some keys do not match the right pattern', () => {
      expect.assertions(1);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      expect(
        () => new LockSmith({ keys: ['000000'] }),
      ).toThrowErrorMatchingSnapshot();
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('instanciates a new LockSmith with a provided workspace', () => {
      expect.assertions(3);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith({
        workspace: '/workspace',
      });
      expect(lockSmith.keys).toEqual([]);
      expect(lockSmith.workspace).toEqual('/workspace');
      expect(mocks.readKeysFromFile).toHaveBeenCalledWith('keys.txt');
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('instanciates a new LockSmith with another default keys file', () => {
      expect.assertions(3);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith({
        defaultKeys: 'filename.txt',
      });
      expect(lockSmith.keys).toEqual([]);
      expect(lockSmith.workspace).toEqual('./');
      expect(mocks.readKeysFromFile).toHaveBeenCalledWith('keys.txt');
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });

  describe('#dump', () => {
    it('dumps a Mifare tag with the expected keys', async () => {
      expect.assertions(1);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve(['-k 00000000'])),
        mfoc: jest.spyOn(LockSmith, 'mfoc')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith();
      await lockSmith.dump('dump.mfd');
      expect(mocks.mfoc).toHaveBeenCalledWith([
        `-O ${resolve('./dump.mfd')}`,
        '-k 00000000',
      ]);
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });

  describe('#clone', () => {
    it('clones a Mifare tag with the expected keys', async () => {
      expect.assertions(1);
      const exec = jest.fn(() => Promise.resolve());
      const mocks = {
        promisify: jest.spyOn(bluebird, 'promisify')
          .mockImplementation(() => exec),
        console: jest.spyOn(console, 'log')
          .mockImplementation(() => jest.fn()),
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith();
      await lockSmith.clone('source.mfd', 'target.mfd');
      expect(exec.mock.calls[0]).toEqual([
        `nfc-mfclassic W X ${resolve('./target.mfd')} ${resolve('./source.mfd')}`,
        [],
      ]);
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('doesn\'t try to unlock the tag if the option is specified', async () => {
      expect.assertions(1);
      const exec = jest.fn(() => Promise.resolve());
      const mocks = {
        promisify: jest.spyOn(bluebird, 'promisify')
          .mockImplementation(() => exec),
        console: jest.spyOn(console, 'log')
          .mockImplementation(() => jest.fn()),
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve()),
      };
      const lockSmith = new LockSmith();
      await lockSmith.clone('source.mfd', 'target.mfd', false);
      expect(exec.mock.calls[0]).toEqual([
        `nfc-mfclassic w x ${resolve('./target.mfd')} ${resolve('./source.mfd')}`,
        [],
      ]);
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });

  describe('#readKeysFromFile', () => {
    it('reads keys from a filename', async () => {
      expect.assertions(1);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve(['-k 00000000'])),
      };
      const lockSmith = new LockSmith();
      await lockSmith.defaultKeys;
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
      const keys = await lockSmith.readKeysFromFile('./__tests__/data/keys.txt');
      expect(keys).toEqual(['-k 484558414354', '-k a22ae129c013']);
    });

    it('returns an empty array if no keys can be found', async () => {
      expect.assertions(1);
      const mocks = {
        readKeysFromFile: jest.spyOn(LockSmith.prototype, 'readKeysFromFile')
          .mockImplementationOnce(() => Promise.resolve(['-k 00000000'])),
      };
      const lockSmith = new LockSmith();
      await lockSmith.defaultKeys;
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
      const keys = await lockSmith.readKeysFromFile('./__tests__/data/unreadableKeys.txt');
      expect(keys).toEqual([]);
    });
  });

  describe('#mfoc', () => {
    it('runs mfoc and returns the given path to the file', async () => {
      expect.assertions(1);
      const exec = jest.fn(() => Promise.resolve());
      const mocks = {
        promisify: jest.spyOn(bluebird, 'promisify')
          .mockImplementation(() => exec),
      };
      await LockSmith.mfoc([]);
      expect(exec.mock.calls[0][0]).toEqual(['mfoc', ''].join(' '));
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });

  describe('#readHexFile', () => {
    it('reads and writes the hex content of a dump', async () => {
      expect.assertions(2);
      const mocks = {
        console: jest.spyOn(console, 'table')
          .mockImplementation(() => jest.fn()),
      };
      const table = await LockSmith.readHexFile('./__tests__/data/dump.mfd');
      expect(table).toMatchSnapshot();
      expect(mocks.console).toHaveBeenCalledWith(table);
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('reads but doesn\'t write the hex content of a dump', async () => {
      expect.assertions(2);
      const mocks = {
        console: jest.spyOn(console, 'table')
          .mockImplementation(() => jest.fn()),
      };
      const table = await LockSmith.readHexFile('./__tests__/data/dump.mfd', false);
      expect(table).toMatchSnapshot();
      expect(mocks.console).not.toHaveBeenCalled();
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });
});

describe('MifareClassic1K', () => {
  describe('#readUID', async () => {
    it('reads an UID using nfc-list', async () => {
      expect.assertions(1);
      const exec = jest.fn(() => Promise.resolve(`
        nfc-list use libnfc 1.4.1 (r869)
        Connected to NFC device: ACS ACR 38U-CCID 00 00 / ACR122U102 - PN532 v1.4 (0x07)
        1 ISO14443A passive target(s) was found:
            ATQA (SENS_RES): 00  02
               UID (NFCID1): 33  c7  76  6c
              SAK (SEL_RES): 18
      `));
      const mocks = {
        promisify: jest.spyOn(bluebird, 'promisify')
          .mockImplementation(() => exec),
      };
      expect(
        await Mifare.MifareClassic1K.readUID(),
      ).toEqual(
        '33c7766c',
      );
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });

    it('throws an error if no tag can be found', async () => {
      expect.assertions(1);
      const exec = jest.fn(() => Promise.resolve(`
        nfc-list use libnfc 1.5.0 (r1019)
        No NFC device found.
      `));
      const mocks = {
        promisify: jest.spyOn(bluebird, 'promisify')
          .mockImplementation(() => exec),
      };
      await expect(
        Mifare.MifareClassic1K.readUID(),
      ).rejects.toMatchSnapshot();
      Object.keys(mocks).forEach(key => mocks[key].mockRestore());
    });
  });
});
