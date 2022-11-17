export interface GwfVisShapeData {
  type: 'geojson' | 'matrix';
  data: any;
}

export interface GloablInfo {
  dimensionDict?: { [dimension: string]: number };
  variableName?: string;
  userSelection?: { dataset: string; location: string };
  pinnedSelections?: { dataset: string; location: string; color: string }[];
}

export interface GwfVisPlugin {
  delegateOfFetchingData?: (query: any) => Promise<any>;
  globalInfo?: GloablInfo;
  delegateOfUpdatingGlobalInfo?: (gloablInfoDict: GloablInfo) => void;
  obtainHeader: () => Promise<string>;
}

export interface GwfVisPluginMap extends GwfVisPlugin {
  leaflet: typeof globalThis.L;
  mapInstance?: L.Map;
  delegateOfRemovingFromMap: (layer: L.Layer) => void;
  delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
}

export interface GwfVisPluginMapLayer extends GwfVisPluginMap {
  layerName: string;
  type: 'base-layer' | 'overlay';
  active: boolean;
}

export interface GwfVisPluginData extends GwfVisPlugin {
  fetchData: (query: any) => Promise<any>;
}
