export interface GwfVisPlugin {
  leaflet: typeof globalThis.L;
}

export interface GwfVisPluginLayer extends GwfVisPlugin {
  addToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  name: string;
  type: 'base-layer' | 'overlay';
  active: boolean;
}