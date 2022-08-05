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
  updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
}

export interface GwfVisPluginLayer extends GwfVisPlugin {
  addingToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  removingFromMapDelegate: (layer: L.Layer) => void;
  name: string;
  type: 'base-layer' | 'overlay';
  active: boolean;
}

export interface GwfVisPluginSidebar extends GwfVisPlugin {
  obtainHeader: () => Promise<string>;
}
