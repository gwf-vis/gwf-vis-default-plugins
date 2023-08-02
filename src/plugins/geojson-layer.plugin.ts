import type { GeoJsonObject } from "geojson";
import type {
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
  LayerType,
  leaflet,
  SharedStates,
} from "gwf-vis-host";
import { LocationSelection, runAsyncWithLoading } from "../utils/basic";
import type { ColorSchemeDefinition } from "../utils/color";
import type {
  DataFrom,
  Dimension,
  GWFVisDBQueryObject,
  Location,
  VariableWithDimensions,
} from "../utils/data";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";
import { generateColorScale } from "../utils/color";
import {
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
} from "../utils/state";
import { obtainObjectChangedPropertyNameSet } from "../utils/state";

export default class GWFVisPluginGeoJSONLayer
  extends GWFVisMapLayerPluginBase
  implements
    GWFVisPluginWithSharedStates,
    GWFVisPluginWithData<GWFVisDBQueryObject, any>
{
  updateSharedStatesDelegate?:
    | ((sharedStates: SharedStates) => void)
    | undefined;
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((dataSource: string, queryObject: any) => Promise<any>)
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
      if (
        changedProps.has("gwf-default.locationSelection") ||
        changedProps.has("gwf-default.locationPins")
      ) {
        await this.updateHighlights();
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
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const locationSelection: LocationSelection = {
            dataSource: obtainCurrentDataSource(
              this.dataFrom,
              this.sharedStates
            ),
            locationId: feature.properties?.id,
          };
          this.updateSharedStatesDelegate?.({
            ...this.sharedStates,
            "gwf-default.locationSelection": locationSelection,
          });
        });
      },
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
      await this.updateHighlights();
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
      ((await this.queryDataDelegate?.(currentDataSource ?? "", {
        for: "max-min-value",
        filter: { variables: [currentVariable?.id] },
      })) as { max?: number; min?: number }) ?? {};
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
        ({ locationId: id }) => id === locationId
      )?.value;
      return `Location ID: ${locationId}<br/>Value: ${value ?? "N/A"}`;
    });
    this.#geojsonLayerInstance?.setStyle((feature) => {
      const { properties } = feature ?? {};
      const value = values?.find(
        ({ locationId }) => locationId === properties?.id
      )?.value;
      const fillColor = value != null ? scaleColor(value) : "transparent";
      const style = {
        fillColor,
        fillOpacity: 0.7,
      };
      return style;
    });
  }

  private async updateHighlights() {
    const locationSelection =
      this.sharedStates?.["gwf-default.locationSelection"];
    const locationPins = this.sharedStates?.["gwf-default.locationPins"];
    this.#geojsonLayerInstance?.setStyle((feature) => {
      const { properties } = feature ?? {};
      const dataSource =
        obtainCurrentDataSource(this.dataFrom, this.sharedStates) ?? "";
      const locationId = properties?.id;
      let style = { color: "hsl(0, 0%, 50%)", weight: 1 };

      const matchedLocationPin = locationPins?.find(
        (location) =>
          location.dataSource === dataSource &&
          location.locationId === locationId
      );
      if (matchedLocationPin && matchedLocationPin.color) {
        style.color = matchedLocationPin.color;
        (
          this.#geojsonLayerInstance
            ?.getLayers()
            ?.find((layer) => (layer as any).feature === feature) as any
        )?.bringToFront();
      }

      if (
        dataSource === locationSelection?.dataSource &&
        locationId === locationSelection.locationId
      ) {
        style.weight = 3;
        (
          this.#geojsonLayerInstance
            ?.getLayers()
            ?.find((layer) => (layer as any).feature === feature) as any
        )?.bringToFront();
      }
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
    const values = (await this.queryDataDelegate?.(dataSource, {
      for: "values",
      filter: { variable: variableId, dimensionIdAndValueDict },
    })) as { locationId: number; value: number }[];
    return values;
  }

  private async obtainDatasetLocations(dataSource?: string) {
    if (this.geojson) {
      return;
    }
    if (!dataSource) {
      return;
    }
    const locations = await this.queryDataDelegate?.(dataSource, {
      for: "locations",
    });
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
