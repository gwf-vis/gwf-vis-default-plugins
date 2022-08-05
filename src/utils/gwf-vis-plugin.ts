export interface GwfVisShapeData {
  type: 'geojson' | 'matrix';
  data: any;
}

export interface GloablInfoDict {
  dimensionDict: { [dimension: string]: number };
  userSelectionDict: { dataset: string; location: string; variable: string };
  pinnedSelections: { dataset: string; location: string; variable: string; color: string }[];
}

export interface GwfVisPlugin {
  leaflet: typeof globalThis.L;
  fetchingDataDelegate: (query: any) => Promise<any>;
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

export interface GwfVisPluginControl extends GwfVisPlugin {
  obtainHeader: () => Promise<string>;
}

export interface GwfVisPluginData extends GwfVisPlugin {
  fetchData: (query: any) => Promise<any>;
}
