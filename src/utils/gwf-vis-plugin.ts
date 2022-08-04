export interface GwfVisShapeData {
  type: 'geojson' | 'matrix';
  data: any;
}

export interface GloablInfoDict {
  dimensionDict: { [dimension: string]: number };
  userSelectionDict: { dataset: string; location: string; variable: string };
}

export interface GwfVisPlugin {
  leaflet: typeof globalThis.L;
  fetchingDataDelegate: (query: any) => any;
  globalInfoDict: GloablInfoDict;
  updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
}

export interface GwfVisPluginLayer extends GwfVisPlugin {
  addToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  removeFromMapDelegate: (layer: L.Layer) => void;
  name: string;
  type: 'base-layer' | 'overlay';
  active: boolean;
}

export interface GwfVisPluginSidebar extends GwfVisPlugin {
  injectedCss: string;
  pluginSlot: 'top' | '';
}
