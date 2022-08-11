export interface GwfVisShapeData {
  type: 'geojson' | 'matrix';
  data: any;
}

export interface GloablInfoDict {
  dimensionDict?: { [dimension: string]: number };
  variableName?: string;
  userSelectionDict?: { dataset: string; location: string };
  pinnedSelections?: { dataset: string; location: string; color: string }[];
}

export interface GwfVisPlugin {
  fetchingDataDelegate?: (query: any) => Promise<any>;
  globalInfoDict?: GloablInfoDict;
  updatingGlobalInfoDelegate?: (gloablInfoDict: GloablInfoDict) => void;
  obtainHeader: () => Promise<string>;
}

export interface GwfVisPluginMap extends GwfVisPlugin {
  leaflet: typeof globalThis.L;
  removingFromMapDelegate: (layer: L.Layer) => void;
  addingToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
}

export interface GwfVisPluginMapLayer extends GwfVisPluginMap {
  name: string;
  type: 'base-layer' | 'overlay';
  active: boolean;
}

export interface GwfVisPluginData extends GwfVisPlugin {
  fetchData: (query: any) => Promise<any>;
}
