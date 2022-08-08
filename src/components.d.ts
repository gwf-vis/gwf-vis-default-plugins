/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { GloablInfoDict } from "./utils/gwf-vis-plugin";
import { ColorSchemeDefinition } from "./components/gwf-vis-plugin-geojson-layer/gwf-vis-plugin-geojson-layer";
export namespace Components {
    interface GwfVisPluginDataFetcher {
        "fetchData": (query: any) => Promise<{ [k: string]: any; }[]>;
        "fetchingDataDelegate": (query: any) => Promise<any>;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "sqliteWorkerUrl": string;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginDimensionControl {
        "datasetId": string;
        "fetchingDataDelegate": (query: any) => Promise<any>;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "obtainHeader": () => Promise<string>;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginGeojsonLayer {
        "active": boolean;
        "addingToMapDelegate": (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "colorScheme"?: { [variableName: string]: ColorSchemeDefinition };
        "datasetId": string;
        "dimensions"?: { [dimension: string]: number };
        "fetchingDataDelegate": (query: any) => any;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "name": string;
        "options"?: L.GeoJSONOptions;
        "removingFromMapDelegate": (layer: L.Layer) => void;
        "type": 'base-layer' | 'overlay';
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
        "variableName"?: string;
    }
    interface GwfVisPluginLineChart {
        "datasetId": string;
        "dimension": string;
        "fetchingDataDelegate": (query: any) => Promise<any>;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "obtainHeader": () => Promise<string>;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
        "variableNames"?: string[];
    }
    interface GwfVisPluginMetadata {
        "fetchingDataDelegate": (query: any) => any;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "obtainHeader": () => Promise<string>;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginSelection {
        "fetchingDataDelegate": (query: any) => any;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "obtainHeader": () => Promise<string>;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginTileLayer {
        "active": boolean;
        "addingToMapDelegate": (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "fetchingDataDelegate": (query: any) => any;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "name": string;
        "options"?: L.TileLayerOptions;
        "removingFromMapDelegate": (layer: L.Layer) => void;
        "type": 'base-layer' | 'overlay';
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
        "urlTemplate": string;
    }
    interface GwfVisPluginVariableControl {
        "datasetId": string;
        "fetchingDataDelegate": (query: any) => Promise<any>;
        "globalInfoDict": GloablInfoDict;
        "leaflet": typeof globalThis.L;
        "obtainHeader": () => Promise<string>;
        "updatingGlobalInfoDelegate": (gloablInfoDict: GloablInfoDict) => void;
    }
}
declare global {
    interface HTMLGwfVisPluginDataFetcherElement extends Components.GwfVisPluginDataFetcher, HTMLStencilElement {
    }
    var HTMLGwfVisPluginDataFetcherElement: {
        prototype: HTMLGwfVisPluginDataFetcherElement;
        new (): HTMLGwfVisPluginDataFetcherElement;
    };
    interface HTMLGwfVisPluginDimensionControlElement extends Components.GwfVisPluginDimensionControl, HTMLStencilElement {
    }
    var HTMLGwfVisPluginDimensionControlElement: {
        prototype: HTMLGwfVisPluginDimensionControlElement;
        new (): HTMLGwfVisPluginDimensionControlElement;
    };
    interface HTMLGwfVisPluginGeojsonLayerElement extends Components.GwfVisPluginGeojsonLayer, HTMLStencilElement {
    }
    var HTMLGwfVisPluginGeojsonLayerElement: {
        prototype: HTMLGwfVisPluginGeojsonLayerElement;
        new (): HTMLGwfVisPluginGeojsonLayerElement;
    };
    interface HTMLGwfVisPluginLineChartElement extends Components.GwfVisPluginLineChart, HTMLStencilElement {
    }
    var HTMLGwfVisPluginLineChartElement: {
        prototype: HTMLGwfVisPluginLineChartElement;
        new (): HTMLGwfVisPluginLineChartElement;
    };
    interface HTMLGwfVisPluginMetadataElement extends Components.GwfVisPluginMetadata, HTMLStencilElement {
    }
    var HTMLGwfVisPluginMetadataElement: {
        prototype: HTMLGwfVisPluginMetadataElement;
        new (): HTMLGwfVisPluginMetadataElement;
    };
    interface HTMLGwfVisPluginSelectionElement extends Components.GwfVisPluginSelection, HTMLStencilElement {
    }
    var HTMLGwfVisPluginSelectionElement: {
        prototype: HTMLGwfVisPluginSelectionElement;
        new (): HTMLGwfVisPluginSelectionElement;
    };
    interface HTMLGwfVisPluginTileLayerElement extends Components.GwfVisPluginTileLayer, HTMLStencilElement {
    }
    var HTMLGwfVisPluginTileLayerElement: {
        prototype: HTMLGwfVisPluginTileLayerElement;
        new (): HTMLGwfVisPluginTileLayerElement;
    };
    interface HTMLGwfVisPluginVariableControlElement extends Components.GwfVisPluginVariableControl, HTMLStencilElement {
    }
    var HTMLGwfVisPluginVariableControlElement: {
        prototype: HTMLGwfVisPluginVariableControlElement;
        new (): HTMLGwfVisPluginVariableControlElement;
    };
    interface HTMLElementTagNameMap {
        "gwf-vis-plugin-data-fetcher": HTMLGwfVisPluginDataFetcherElement;
        "gwf-vis-plugin-dimension-control": HTMLGwfVisPluginDimensionControlElement;
        "gwf-vis-plugin-geojson-layer": HTMLGwfVisPluginGeojsonLayerElement;
        "gwf-vis-plugin-line-chart": HTMLGwfVisPluginLineChartElement;
        "gwf-vis-plugin-metadata": HTMLGwfVisPluginMetadataElement;
        "gwf-vis-plugin-selection": HTMLGwfVisPluginSelectionElement;
        "gwf-vis-plugin-tile-layer": HTMLGwfVisPluginTileLayerElement;
        "gwf-vis-plugin-variable-control": HTMLGwfVisPluginVariableControlElement;
    }
}
declare namespace LocalJSX {
    interface GwfVisPluginDataFetcher {
        "fetchingDataDelegate"?: (query: any) => Promise<any>;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "sqliteWorkerUrl"?: string;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginDimensionControl {
        "datasetId"?: string;
        "fetchingDataDelegate"?: (query: any) => Promise<any>;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginGeojsonLayer {
        "active"?: boolean;
        "addingToMapDelegate"?: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "colorScheme"?: { [variableName: string]: ColorSchemeDefinition };
        "datasetId"?: string;
        "dimensions"?: { [dimension: string]: number };
        "fetchingDataDelegate"?: (query: any) => any;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "name"?: string;
        "options"?: L.GeoJSONOptions;
        "removingFromMapDelegate"?: (layer: L.Layer) => void;
        "type"?: 'base-layer' | 'overlay';
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
        "variableName"?: string;
    }
    interface GwfVisPluginLineChart {
        "datasetId"?: string;
        "dimension"?: string;
        "fetchingDataDelegate"?: (query: any) => Promise<any>;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
        "variableNames"?: string[];
    }
    interface GwfVisPluginMetadata {
        "fetchingDataDelegate"?: (query: any) => any;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginSelection {
        "fetchingDataDelegate"?: (query: any) => any;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
    }
    interface GwfVisPluginTileLayer {
        "active"?: boolean;
        "addingToMapDelegate"?: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "fetchingDataDelegate"?: (query: any) => any;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "name"?: string;
        "options"?: L.TileLayerOptions;
        "removingFromMapDelegate"?: (layer: L.Layer) => void;
        "type"?: 'base-layer' | 'overlay';
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
        "urlTemplate"?: string;
    }
    interface GwfVisPluginVariableControl {
        "datasetId"?: string;
        "fetchingDataDelegate"?: (query: any) => Promise<any>;
        "globalInfoDict"?: GloablInfoDict;
        "leaflet"?: typeof globalThis.L;
        "updatingGlobalInfoDelegate"?: (gloablInfoDict: GloablInfoDict) => void;
    }
    interface IntrinsicElements {
        "gwf-vis-plugin-data-fetcher": GwfVisPluginDataFetcher;
        "gwf-vis-plugin-dimension-control": GwfVisPluginDimensionControl;
        "gwf-vis-plugin-geojson-layer": GwfVisPluginGeojsonLayer;
        "gwf-vis-plugin-line-chart": GwfVisPluginLineChart;
        "gwf-vis-plugin-metadata": GwfVisPluginMetadata;
        "gwf-vis-plugin-selection": GwfVisPluginSelection;
        "gwf-vis-plugin-tile-layer": GwfVisPluginTileLayer;
        "gwf-vis-plugin-variable-control": GwfVisPluginVariableControl;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "gwf-vis-plugin-data-fetcher": LocalJSX.GwfVisPluginDataFetcher & JSXBase.HTMLAttributes<HTMLGwfVisPluginDataFetcherElement>;
            "gwf-vis-plugin-dimension-control": LocalJSX.GwfVisPluginDimensionControl & JSXBase.HTMLAttributes<HTMLGwfVisPluginDimensionControlElement>;
            "gwf-vis-plugin-geojson-layer": LocalJSX.GwfVisPluginGeojsonLayer & JSXBase.HTMLAttributes<HTMLGwfVisPluginGeojsonLayerElement>;
            "gwf-vis-plugin-line-chart": LocalJSX.GwfVisPluginLineChart & JSXBase.HTMLAttributes<HTMLGwfVisPluginLineChartElement>;
            "gwf-vis-plugin-metadata": LocalJSX.GwfVisPluginMetadata & JSXBase.HTMLAttributes<HTMLGwfVisPluginMetadataElement>;
            "gwf-vis-plugin-selection": LocalJSX.GwfVisPluginSelection & JSXBase.HTMLAttributes<HTMLGwfVisPluginSelectionElement>;
            "gwf-vis-plugin-tile-layer": LocalJSX.GwfVisPluginTileLayer & JSXBase.HTMLAttributes<HTMLGwfVisPluginTileLayerElement>;
            "gwf-vis-plugin-variable-control": LocalJSX.GwfVisPluginVariableControl & JSXBase.HTMLAttributes<HTMLGwfVisPluginVariableControlElement>;
        }
    }
}
