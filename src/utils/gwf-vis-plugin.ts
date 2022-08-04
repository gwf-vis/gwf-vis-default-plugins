export interface GwfVisShapeData {
  type: 'geojson' | 'matrix';
  data: any;
}

export interface ObtainDataDelegateDict {
  obtainShape: (dataset: string) => GwfVisShapeData;
  obtainValue: (dataset: string, locationId: string, variable: string, dimensionDict: { [dimension: string]: number }) => number;
  obtainMetadata: (_dataset: string, _locationId: string) => any;
}

export interface GloablInfoDict {
  dimensionDict: { [dimension: string]: number };
  locationSelection: { datasetName: string; locationId: string };
  variableSelection: string;
}

export interface GwfVisPlugin {
  leaflet: typeof globalThis.L;
  obtainDataDelegateDict: ObtainDataDelegateDict;
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
