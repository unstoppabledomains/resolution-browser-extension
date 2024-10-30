import type {EnvironmentContext} from '@jest/environment';
import JSDOMEnvironment from 'jest-environment-jsdom';

// Stolen from https://github.com/facebook/jest/issues/7780#issuecomment-615890410
// and https://github.com/firebase/firebase-js-sdk/issues/3096#issuecomment-827741103
// Overcomes error from jest internals...: https://github.com/facebook/jest/issues/7780

class MyEnvironment extends JSDOMEnvironment {
  constructor(config: any, context: EnvironmentContext) {
    super(
      Object.assign({}, config, {
        globalConfig: Object.assign({}, config.globalConfig, {
          Uint32Array: Uint32Array,
          Uint8Array: Uint8Array,
          ArrayBuffer: ArrayBuffer,
        }),
      }),
      context,
    );

    global.Uint8Array = Uint8Array;
  }
}

module.exports = MyEnvironment;
