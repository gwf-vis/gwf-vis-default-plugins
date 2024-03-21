import type { GeoJsonObject } from "geojson";
import type {
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
  LayerType,
  leaflet,
  SharedStates,
} from "vga-vis-host";
import { LocationSelection, runAsyncWithLoading } from "../utils/basic";
import type { ColorSchemeDefinition } from "../utils/color";
import type {
  DataFrom,
  Dimension,
  GWFVisDBQueryObject,
  Location,
  Value,
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
import { scaleLinear } from "d3";

const PUSH_PIN_ICON = globalThis.L.icon({
  iconUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=",
  shadowUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBAE0Aoz/f9/HTMzhg1zrdKUrJbdx+Kd2nD8VNudfsL/Th///dyQN2TH6f3y/BGpC379rV+S+qqetBOxImNQXL8JCAr2V4iMQXHGNJxeCfZXhSRBcQMfvkOWUdtfzlLgAENmZDcmo2TVmt8OSM2eXxBp3DjHSMFutqS7SbmemzBiR+xpKCNUIRkdkkYxhAkyGoBvyQFEJEefwSmmvBfJuJ6aKqKWnAkvGZOaZXTUgFqYULWNSHUckZuR1HIIimUExutRxwzOLROIG4vKmCKQt364mIlhSyzAf1m9lHZHJZrlAOMMztRRiKimp/rpdJDc9Awry5xTZCte7FHtuS8wJgeYGrex28xNTd086Dik7vUMscQOa8y4DoGtCCSkAKlNwpgNtphjrC6MIHUkR6YWxxs6Sc5xqn222mmCRFzIt8lEdKx+ikCtg91qS2WpwVfBelJCiQJwvzixfI9cxZQWgiSJelKnwBElKYtDOb2MFbhmUigbReQBV0Cg4+qMXSxXSyGUn4UbF8l+7qdSGnTC0XLCmahIgUHLhLOhpVCtw4CzYXvLQWQbJNmxoCsOKAxSgBJno75avolkRw8iIAFcsdc02e9iyCd8tHwmeSSoKTowIgvscSGZUOA7PuCN5b2BX9mQM7S0wYhMNU74zgsPBj3HU7wguAfnxxjFQGBE6pwN+GjME9zHY7zGp8wVxMShYX9NXvEWD3HbwJf4giO4CFIQxXScH1/TM+04kkBiAAAAAElFTkSuQmCC",
  iconSize: [20, 40],
  iconAnchor: [10, 40],
});

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
  #pinnedLocationSecondaryColorCache: Record<string, Record<number, string>> =
    {};
  #pinnedLocationTertiaryLineWeightCache: Record<
    string,
    Record<number, number>
  > = {};

  displayName: string = "geojson layer";
  type: LayerType = "overlay";
  active: boolean = false;
  options?: leaflet.GeoJSONOptions;
  dataFrom?: DataFrom;
  secondaryDataFrom?: DataFrom;
  tertiaryDataFrom?: DataFrom;
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  };
  pointMode?: "pushpin" | "circle" = "circle";
  pointSize?: number = 10;
  lineWeightRange: [number, number] = [1, 5];

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
        changedProps.has("gwf-default.currentSecondaryVariableId") ||
        changedProps.has("gwf-default.currentTertiaryVariableId") ||
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
      pointToLayer: (_feature, latlng) => {
        switch (this.pointMode) {
          case "pushpin":
            return new globalThis.L.Marker(latlng, { icon: PUSH_PIN_ICON });
          default:
            return new globalThis.L.CircleMarker(latlng, {
              radius: this.pointSize,
            });
        }
      },
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
      "primary",
      this
    );
    const currentColorScheme = await obtainCurrentColorScheme(
      currentDataSource,
      currentVariable,
      this.dataFrom,
      this.colorScheme,
      this.sharedStates,
      "primary",
      this
    );
    const scaleColor = generateColorScale(currentColorScheme);
    switch (currentColorScheme?.type) {
      case "quantile": {
        const allValues = (
          (await this.queryDataDelegate?.(currentDataSource ?? "", {
            for: "values",
            filter: { variable: currentVariable?.id },
          })) as { value: number }[]
        ).map(({ value }) => value);
        if (!allValues) {
          return;
        }
        (scaleColor as d3.ScaleQuantile<any, never>).domain(allValues);
        break;
      }
      case "threshold":
        break;
      default: {
        const { max, min } =
          ((await this.queryDataDelegate?.(currentDataSource ?? "", {
            for: "max-min-value",
            filter: { variables: [currentVariable?.id] },
          })) as { max?: number; min?: number }) ?? {};
        scaleColor.domain([
          min ?? Number.NEGATIVE_INFINITY,
          max ?? Number.POSITIVE_INFINITY,
        ]);
        break;
      }
    }

    // TODO refactor
    const currentSecondaryVariable = await obtainCurrentVariable(
      currentDataSource,
      this.secondaryDataFrom,
      this.sharedStates,
      "secondary",
      this
    );
    const currentSecondaryColorScheme =
      currentSecondaryVariable &&
      (await obtainCurrentColorScheme(
        currentDataSource,
        currentSecondaryVariable,
        this.secondaryDataFrom,
        this.colorScheme,
        this.sharedStates,
        "secondary",
        this
      ));
    const scaleSecondaryColor =
      currentSecondaryVariable &&
      generateColorScale(currentSecondaryColorScheme);
    if (currentSecondaryVariable) {
      switch (currentSecondaryColorScheme?.type) {
        case "quantile": {
          const allValues = (
            (await this.queryDataDelegate?.(currentDataSource ?? "", {
              for: "values",
              filter: { variable: currentSecondaryVariable?.id },
            })) as { value: number }[]
          ).map(({ value }) => value);
          if (!allValues) {
            return;
          }
          (scaleSecondaryColor as d3.ScaleQuantile<any, never>)?.domain(
            allValues
          );
          break;
        }
        case "threshold":
          break;
        default: {
          const { max, min } =
            ((await this.queryDataDelegate?.(currentDataSource ?? "", {
              for: "max-min-value",
              filter: { variables: [currentSecondaryVariable?.id] },
            })) as { max?: number; min?: number }) ?? {};
          scaleSecondaryColor?.domain([
            min ?? Number.NEGATIVE_INFINITY,
            max ?? Number.POSITIVE_INFINITY,
          ]);
          break;
        }
      }
    }

    // TODO refactor
    const currentTertiaryVariable = await obtainCurrentVariable(
      currentDataSource,
      this.tertiaryDataFrom,
      this.sharedStates,
      "tertiary",
      this
    );
    const { max = Number.POSITIVE_INFINITY, min = Number.NEGATIVE_INFINITY } =
      ((await this.queryDataDelegate?.(currentDataSource ?? "", {
        for: "max-min-value",
        filter: { variables: [currentTertiaryVariable?.id] },
      })) as { max?: number; min?: number }) ?? {};
    const lineWeightScale = scaleLinear(this.lineWeightRange).domain([
      min,
      max,
    ]);

    this.#geojsonLayerInstance?.bindTooltip(({ feature }: any) => {
      const locationId = feature?.properties?.id;
      const value = values?.find(
        ({ location, variable }) =>
          location.id === locationId && variable.id === currentVariable?.id
      )?.value;
      const secondaryValue =
        currentSecondaryVariable &&
        values?.find(
          ({ location, variable }) =>
            location.id === locationId &&
            variable.id === currentSecondaryVariable?.id
        )?.value;
      const tertiaryValue =
        currentTertiaryVariable &&
        values?.find(
          ({ location, variable }) =>
            location.id === locationId &&
            variable.id === currentTertiaryVariable?.id
        )?.value;
      return `Location ID: ${locationId}<br/>${currentVariable?.name}: ${
        value ?? "N/A"
      }${
        currentSecondaryVariable
          ? `<br/>${currentSecondaryVariable.name}: ${secondaryValue ?? "N/A"}`
          : ""
      }${
        currentTertiaryVariable
          ? `<br/>${currentTertiaryVariable.name}: ${tertiaryValue ?? "N/A"}`
          : ""
      }`;
    });
    if (currentDataSource) {
      this.#pinnedLocationSecondaryColorCache[currentDataSource] = {};
      this.#pinnedLocationTertiaryLineWeightCache[currentDataSource] = {};
    }
    this.#geojsonLayerInstance?.setStyle((feature) => {
      const { properties } = feature ?? {};
      const value = values?.find(
        ({ location, variable }) =>
          location.id === properties?.id && variable.id === currentVariable?.id
      )?.value;
      const secondaryValue =
        currentSecondaryVariable &&
        values?.find(
          ({ location, variable }) =>
            location.id === properties?.id &&
            variable.id === currentSecondaryVariable?.id
        )?.value;
      const tertiaryValue =
        currentTertiaryVariable &&
        values?.find(
          ({ location, variable }) =>
            location.id === properties?.id &&
            variable.id === currentTertiaryVariable?.id
        )?.value;
      const fillColor = value != null ? scaleColor(value) : "transparent";
      const color =
        secondaryValue != null
          ? scaleSecondaryColor?.(secondaryValue)
          : "hsl(0, 0%, 50%)";
      const lineWeight =
        tertiaryValue != null
          ? lineWeightScale(tertiaryValue)
          : this.lineWeightRange[0];
      const style = {
        color,
        fillColor,
        fillOpacity: 0.7,
        weight: lineWeight,
      };
      if (currentDataSource && properties?.id != null) {
        this.#pinnedLocationSecondaryColorCache[currentDataSource][
          properties.id
        ] = color;
        this.#pinnedLocationTertiaryLineWeightCache[currentDataSource][
          properties.id
        ] = lineWeight;
      }
      return style;
    });
  }

  private async updateHighlights() {
    const currentDataSource = obtainCurrentDataSource(
      this.dataFrom,
      this.sharedStates
    );
    const locationSelection =
      this.sharedStates?.["gwf-default.locationSelection"];
    const locationPins = this.sharedStates?.["gwf-default.locationPins"];
    this.#geojsonLayerInstance?.setStyle((feature) => {
      const { properties } = feature ?? {};
      const dataSource =
        obtainCurrentDataSource(this.dataFrom, this.sharedStates) ?? "";
      const locationId = properties?.id;
      let style: any = { weight: 1 };

      const cachedSecondaryColor =
        this.#pinnedLocationSecondaryColorCache[currentDataSource ?? ""]?.[
          properties?.id ?? ""
        ];
      if (cachedSecondaryColor) {
        style.color = cachedSecondaryColor;
      }

      const cachedTertiaryLineWeight =
        this.#pinnedLocationTertiaryLineWeightCache[currentDataSource ?? ""]?.[
          properties?.id ?? ""
        ];
      if (cachedTertiaryLineWeight) {
        style.weight = cachedTertiaryLineWeight;
        style.dashArray = undefined;
      }

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
        // style.weight = 3;
        style.dashArray = "10";
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
      "primary",
      this
    );
    const secondaryVariable = await obtainCurrentVariable(
      dataSource,
      this.secondaryDataFrom,
      this.sharedStates,
      "secondary",
      this
    );
    const tertiaryVariable = await obtainCurrentVariable(
      dataSource,
      this.tertiaryDataFrom,
      this.sharedStates,
      "tertiary",
      this
    );
    if (!variable && !secondaryVariable && !tertiaryVariable) {
      return;
    }
    const variableIds = [];
    if (variable) {
      variableIds.push(variable.id);
    }
    if (secondaryVariable) {
      variableIds.push(secondaryVariable.id);
    }
    if (tertiaryVariable) {
      variableIds.push(tertiaryVariable.id);
    }
    const dimensionIdAndValueDict =
      await this.obtainCurrentDimensionIdAndValueDict(dataSource, variable);
    if (!dimensionIdAndValueDict) {
      return;
    }
    const values = (await this.queryDataDelegate?.(dataSource, {
      for: "values",
      filter: { variable: variableIds, dimensionIdAndValueDict },
    })) as Value[];
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
    availableDimensions.map((dimension) => {
      return [dimension.id, dimensionNameAndValueDict[dimension.name]];
    });
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
    const currentVariable: VariableWithDimensions | undefined =
      variable ??
      (await obtainCurrentVariable(
        currentDataSource,
        this.dataFrom,
        this.#sharedStates,
        "primary",
        this
      ));
    if (!currentDataSource || !currentVariable) {
      return;
    }
    const availableDimensions = (await this.queryDataDelegate?.(
      currentDataSource,
      {
        for: "dimensions",
      }
    )) as Dimension[] | undefined;
    const dimensionIdAndValueDict =
      (await this.obtainDimensionIdAndValueDict(
        dataSource,
        availableDimensions,
        this.dataFrom?.dimensionValueDict
      )) ??
      this.sharedStates?.["gwf-default.dimensionValueDict"]?.[
        currentDataSource
      ]?.[currentVariable.id];
    const dimensionIdAndValueDictWithNullFallback = {
      ...Object.fromEntries(
        availableDimensions?.map((dimension) => {
          return [dimension.id, null];
        }) ?? []
      ),
      ...dimensionIdAndValueDict,
    };
    return dimensionIdAndValueDictWithNullFallback;
  }
}
