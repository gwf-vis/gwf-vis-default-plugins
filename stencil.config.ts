import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'gwf-vis-plugins',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      externalRuntime: false,
      autoDefineCustomElements: false,
      includeGlobalScripts: true,
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
