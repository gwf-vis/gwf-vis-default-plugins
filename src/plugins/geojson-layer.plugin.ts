import type { GeoJsonObject } from "geojson";
import type {
  GWFVisPluginWithSharedStates,
  LayerType,
  leaflet,
} from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import type {
  GWFVisDefaultPluginSharedStates,
  GWFVisDefaultPluginWithData,
} from "../utils/basic";
import type { Dimension, Location, Value } from "../utils/data";

import { property } from "lit/decorators.js";
import {
  obtainAvailableLocations,
  obtainAvailableVariables,
} from "../utils/data";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";

export default class GWFVisPluginGeoJSONLayer
  extends GWFVisMapLayerPluginBase
  implements GWFVisPluginWithSharedStates, GWFVisDefaultPluginWithData
{
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
    | undefined;

  #geojsonLayerInstance?: leaflet.GeoJSON;
  #currentLocations?: Location[];

  @property() displayName: string = "geojson layer";
  @property() type: LayerType = "overlay";
  @property() active: boolean = false;
  @property() geojson?: GeoJsonObject | GeoJsonObject[] | string;
  @property() options?: leaflet.GeoJSONOptions;
  @property() dataFrom?: {
    dataSource?: string;
    variableName?: string;
    dimensionValueDict?: { [dimension: string]: number };
  };

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    this.updateMap();
  }

  obtainHeaderCallback = () => `GeoJSON Layer - ${this.displayName}`;

  protected override async initializeMapLayer() {
    this.#geojsonLayerInstance &&
      this.removeMapLayerDelegate?.(this.#geojsonLayerInstance);
    this.#geojsonLayerInstance = this.leaflet?.geoJSON(undefined, {
      ...this.options,
      pointToLayer: (_feature, latlng) =>
        new globalThis.L.CircleMarker(latlng, { radius: 10 }),
    });
    this.#geojsonLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#geojsonLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
    await this.updateMap();
  }

  private async updateMap() {
    const loadingEndDelegate = this.notifyLoadingDelegate?.();
    await new Promise<void>((resolve) =>
      setTimeout(async () => {
        await this.updateFeatures();
        this.#currentLocations && (await this.updateData());
        loadingEndDelegate?.();
        resolve();
      })
    );
  }

  private async updateFeatures() {
    this.#geojsonLayerInstance?.clearLayers();
    let geojson = await this.obtainGeoJSON();
    if (geojson == null) {
      return;
    }
    if (!Array.isArray(geojson)) {
      geojson = [geojson];
    }
    geojson.forEach((d) => this.#geojsonLayerInstance?.addData(d));
  }

  private async updateData() {
    const values = await this.obtainDatasetValues();
    if (!values) {
      return;
    }
    const { max, min } = (await this.obtainDatasetMaxAndMinForVariable()) ?? {};
    if (max == null && min == null) {
      return;
    }
    this.#geojsonLayerInstance?.bindTooltip(({ feature }: any) => {
      const locationId = feature?.properties?.id;
      const value = values?.find(
        ({ location }) => location.id === locationId
      )?.value;
      return `Location ID: ${locationId}<br/>Value: ${value ?? "N/A"}`;
    });
    this.#geojsonLayerInstance?.setStyle((feature) => {
      const { properties } = feature ?? {};
      const value = values?.find(
        ({ location }) => location.id === properties?.id
      )?.value;
      const hue =
        value != null && max != null && min != null
          ? ((value - min) / (max - min)) * 360
          : undefined;
      // TODO use color scheme
      const fillColor = hue != null ? `hsl(${hue}, 100%, 50%)` : "transparent";
      const style = {
        fillColor,
        fillOpacity: 0.5,
      };
      return style;
    });
  }

  private async obtainGeoJSON() {
    if (typeof this.geojson === "string") {
      return JSON.parse(this.geojson) as GeoJsonObject | GeoJsonObject[];
    }
    if (typeof this.geojson === "object") {
      return this.geojson;
    }
    const dataSource =
      this.dataFrom?.dataSource ??
      this.sharedStates?.["gwf-default.currentDataSource"];
    if (!dataSource) {
      return;
    }
    const locations = await this.obtainDatasetLocations(dataSource);
    this.#currentLocations = locations;
    if (!locations) {
      return;
    }
    const geojson = {
      type: "FeatureCollection",
      features:
        locations?.map((location: Location) => ({
          type: "Feature",
          properties: {
            id: location.id,
          },
          geometry: location.geometry,
        })) || [],
    } as GeoJSON.FeatureCollection;
    return geojson;
  }

  private async obtainDatasetMaxAndMinForVariable() {
    const dataSource =
      this.dataFrom?.dataSource ??
      this.sharedStates?.["gwf-default.currentDataSource"];
    if (!dataSource) {
      return;
    }
    const variable = await this.findVariable(
      dataSource,
      this.dataFrom?.variableName
    );
    const variableId =
      variable?.id ?? this.sharedStates?.["gwf-default.currentVariableId"];
    if (variableId == null) {
      return;
    }

    const sql = `SELECT MAX(value), MIN(value) FROM value where variable = ${variableId}`;
    const sqlResult = await this.queryDataDelegate?.(dataSource, sql);
    const [max, min] = sqlResult?.values?.[0] ?? [];
    return { max: +(max ?? Number.NaN), min: +(min ?? Number.NaN) };
  }

  private async obtainDatasetValues() {
    const dataSource =
      this.dataFrom?.dataSource ??
      this.sharedStates?.["gwf-default.currentDataSource"];
    if (!dataSource) {
      return;
    }
    const variable = await this.findVariable(
      dataSource,
      this.dataFrom?.variableName
    );
    const variableId =
      variable?.id ?? this.sharedStates?.["gwf-default.currentVariableId"];
    if (variableId == null) {
      return;
    }
    const dimensionIdAndValueDict =
      (await this.obtainDimensionIdAndValueDict(
        dataSource,
        variable?.dimensions,
        this.dataFrom?.dimensionValueDict
      )) ??
      this.sharedStates?.["gwf-default.dimensionValueDict"]?.[dataSource]?.[
        variableId
      ];
    if (!dimensionIdAndValueDict) {
      return;
    }
    const selectClause = `SELECT location, value`;
    const fromClause = `FROM value`;
    const variableCondition = `variable = ${variableId}`;
    const dimensionConditon = Object.entries(dimensionIdAndValueDict)
      .map(([id, value]) => `dimension_${id} = ${value}`)
      .join(" and ");
    const whereClause = `WHERE ${variableCondition} and ${dimensionConditon}`;
    const sql = `${selectClause}\n${fromClause}\n${whereClause}`;
    const sqlResult = await this.queryDataDelegate?.(dataSource, sql);
    const values = sqlResult?.values?.map(
      (d) =>
        ({
          ...Object.fromEntries(
            d?.map((value, columnIndex) => {
              const columnName = sqlResult?.columns?.[columnIndex];
              if (columnName === "location") {
                const location = value
                  ? this.#currentLocations?.find(
                      (location) => location.id === value
                    )
                  : undefined;
                return [columnName, location];
              }
              return [columnName, value];
            })
          ),
          variable,
          dimensionIdAndValueDict,
        } as Value)
    );
    return values;
  }

  private async obtainDatasetLocations(dataSource?: string) {
    if (!dataSource) {
      return;
    }
    const locations = await obtainAvailableLocations(dataSource, this);
    return locations;
  }

  private async findVariable(
    dataSource: string | undefined,
    variableName: string | undefined
  ) {
    if (!dataSource || !variableName) {
      return;
    }
    const availableVariables = await obtainAvailableVariables(dataSource, this);
    return availableVariables?.find(
      (variable) => variable.name === variableName
    );
  }

  private async obtainDimensionIdAndValueDict(
    dataSource: string | undefined,
    availableDimensions: Dimension[] | undefined,
    dimensionNameAndValueDict:
      | { [dimension: string]: number | undefined }
      | undefined
  ) {
    if (!dataSource || !availableDimensions || !dimensionNameAndValueDict) {
      return;
    }
    let result = {} as
      | { [dimensionId: number]: number | undefined }
      | undefined;
    Object.entries(dimensionNameAndValueDict).every(([name, value]) => {
      const id = availableDimensions.find(
        (dimension) => dimension.name === name
      )?.id;
      if (id == null) {
        result = undefined;
        return false;
      }
      result && (result[id] = value);
      return true;
    });
    return result;
  }
}
