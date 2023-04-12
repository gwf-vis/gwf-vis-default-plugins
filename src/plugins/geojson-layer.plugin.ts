import type { GeoJsonObject } from "geojson";
import type {
  GWFVisPluginWithSharedStates,
  LayerType,
  leaflet,
} from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import {
  GWFVisDefaultPluginWithData,
  runAsyncWithLoading,
} from "../utils/basic";
import type { ColorSchemeDefinition } from "../utils/color";
import type {
  DataFrom,
  Dimension,
  Location,
  Value,
  VariableWithDimensions,
} from "../utils/data";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { obtainAvailableLocations } from "../utils/data";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";
import { generateColorScale } from "../utils/color";
import {
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
  obtainMaxAndMinForVariable,
} from "../utils/data";
import { obtainObjectChangedPropertyNameSet } from "../utils/state";

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
  #previousSharedStates?: GWFVisDefaultPluginSharedStates;

  displayName: string = "geojson layer";
  type: LayerType = "overlay";
  active: boolean = false;
  options?: leaflet.GeoJSONOptions;
  dataFrom?: DataFrom;
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  };

  #geojson?: GeoJsonObject | GeoJsonObject[] | string;
  get geojson() {
    return this.#geojson;
  }
  set geojson(value: GeoJsonObject | GeoJsonObject[] | string | undefined) {
    this.#geojson = value;
    this.updateMap();
  }

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    const changedProps = obtainObjectChangedPropertyNameSet(
      this.#previousSharedStates,
      this.#sharedStates
    );
    this.#previousSharedStates = { ...this.sharedStates };
    runAsyncWithLoading(async () => {
      if (changedProps.has("gwf-default.currentDataSource")) {
        await this.updateMap();
      } else if (
        changedProps.has("gwf-default.currentVariableId") ||
        changedProps.has("gwf-default.dimensionValueDict")
      ) {
        await this.updateData();
      }
    }, this);
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
    await runAsyncWithLoading(async () => {
      await this.updateFeatures();
      await this.updateData();
    }, this);
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
    if (!this.#currentLocations) {
      return;
    }
    const values = await this.obtainDatasetValues();
    if (!values) {
      this.#geojsonLayerInstance?.setStyle(() => {
        const style = {
          fillColor: "transparent",
          fillOpacity: 0.7,
        };
        return style;
      });
      return;
    }
    const currentDataSource = obtainCurrentDataSource(
      this.dataFrom,
      this.sharedStates
    );
    const currentVariable = await obtainCurrentVariable(
      currentDataSource,
      this.dataFrom,
      this.sharedStates,
      this
    );
    const { max, min } =
      (await obtainMaxAndMinForVariable(
        currentDataSource,
        currentVariable?.id,
        this
      )) ?? {};
    if (max == null && min == null) {
      return;
    }
    const currentColorScheme = await obtainCurrentColorScheme(
      currentDataSource,
      currentVariable,
      this.dataFrom,
      this.colorScheme,
      this.sharedStates,
      this
    );
    const scaleColor = generateColorScale(currentColorScheme).domain([
      min as number,
      max as number,
    ]) as (value: number) => any;
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
      const fillColor = value != null ? scaleColor(value) : "transparent";
      const style = {
        fillColor,
        fillOpacity: 0.7,
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
    const dataSource = obtainCurrentDataSource(
      this.dataFrom,
      this.sharedStates
    );
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

  private async obtainDatasetValues() {
    const dataSource = obtainCurrentDataSource(
      this.dataFrom,
      this.sharedStates
    );
    if (!dataSource) {
      return;
    }
    let variable = await obtainCurrentVariable(
      dataSource,
      this.dataFrom,
      this.sharedStates,
      this
    );
    if (!variable) {
      return;
    }
    const variableId = variable?.id;
    if (variableId == null) {
      return;
    }
    const dimensionIdAndValueDict =
      await this.obtainCurrentDimensionIdAndValueDict(dataSource, variable);
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
    if (this.geojson) {
      return;
    }
    if (!dataSource) {
      return;
    }
    const locations = await obtainAvailableLocations(dataSource, this);
    return locations;
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

  private async obtainCurrentDimensionIdAndValueDict(
    dataSource?: string,
    variable?: VariableWithDimensions
  ) {
    const currentDataSource =
      dataSource ?? obtainCurrentDataSource(this.dataFrom, this.sharedStates);
    const currentVariable =
      variable ??
      (await obtainCurrentVariable(
        currentDataSource,
        this.dataFrom,
        this.#sharedStates,
        this
      ));
    if (!currentDataSource || !currentVariable) {
      return;
    }
    const dimensionIdAndValueDict =
      (await this.obtainDimensionIdAndValueDict(
        dataSource,
        currentVariable.dimensions,
        this.dataFrom?.dimensionValueDict
      )) ??
      this.sharedStates?.["gwf-default.dimensionValueDict"]?.[
        currentDataSource
      ]?.[currentVariable.id];
    return dimensionIdAndValueDict;
  }
}
