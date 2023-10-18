import type {
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
  LayerType,
  SharedStates,
  leaflet,
} from "vga-vis-host";
import { tricontour } from "d3-tricontour";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";
import { LocationSelection, runAsyncWithLoading } from "../utils/basic";
import {
  DataFrom,
  Dimension,
  GWFVisDBQueryObject,
  Location,
  Value,
  VariableWithDimensions,
} from "../utils/data";
import {
  GWFVisDefaultPluginSharedStates,
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
} from "../utils/state";
import { ColorSchemeDefinition, generateColorScale } from "../utils/color";
import { obtainObjectChangedPropertyNameSet } from "../utils/state";

export default class GWFVisPluginContourLayer
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

  #contourLayerInstance?: leaflet.GeoJSON;
  #previousSharedStates?: GWFVisDefaultPluginSharedStates;

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
    if (
      changedProps.has("gwf-default.currentDataSource") ||
      changedProps.has("gwf-default.currentVariableId") ||
      changedProps.has("gwf-default.dimensionValueDict")
    ) {
      this.updateMap();
    }
  }

  displayName: string = "contour layer";
  type: LayerType = "overlay";
  active: boolean = false;
  dataFrom?: DataFrom;
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  };
  thresholds?: number | number[] = 5;

  obtainHeaderCallback = () => `Contour Layer - ${this.displayName}`;

  protected override initializeMapLayer() {
    this.#contourLayerInstance &&
      this.removeMapLayerDelegate?.(this.#contourLayerInstance);
    this.#contourLayerInstance = this.leaflet?.geoJSON();
    this.#contourLayerInstance?.on("click", async (event) => {
      await runAsyncWithLoading(async () => {
        const point = { x: event.latlng.lng, y: event.latlng.lat };
        const dataSource = obtainCurrentDataSource(
          this.dataFrom,
          this.sharedStates
        );
        if (!dataSource) {
          return;
        }
        const locations = await this.queryDataDelegate?.(dataSource ?? "", {
          for: "locations",
        });
        const nearestLocation = this.findNearestLocation(point, locations);
        if (!nearestLocation) {
          return;
        }
        const locationSelection: LocationSelection = {
          dataSource,
          locationId: nearestLocation.id,
        };
        this.updateSharedStatesDelegate?.({
          ...this.sharedStates,
          "gwf-default.locationSelection": locationSelection,
        });
      }, this);
    });
    this.updateMap();
    this.#contourLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#contourLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
  }

  private async updateMap() {
    await runAsyncWithLoading(async () => {
      const dataSource = obtainCurrentDataSource(
        this.dataFrom,
        this.sharedStates
      );
      if (!dataSource) {
        return;
      }
      const variable = await obtainCurrentVariable(
        dataSource,
        this.dataFrom,
        this.sharedStates,
        this
      );
      const dimensionIdAndValueDict =
        await this.obtainCurrentDimensionIdAndValueDict(dataSource, variable);

      if (!variable || !dimensionIdAndValueDict) {
        return;
      }
      let values: Value[] | undefined,
        maxValue: number | undefined,
        minValue: number | undefined;
      values = await this.queryDataDelegate?.(dataSource, {
        for: "values",
        filter: {
          variable: variable?.id,
          dimensionIdAndValueDict,
        },
      });
      ({ min: minValue, max: maxValue } = ((await this.queryDataDelegate?.(
        dataSource,
        {
          for: "max-min-value",
          filter: {
            variables: [variable?.id],
          },
        }
      )) as { min?: number; max?: number }) ?? {
        min: undefined,
        max: undefined,
      });
      const currentColorScheme = await obtainCurrentColorScheme(
        dataSource,
        variable,
        this.dataFrom,
        this.colorScheme,
        this.sharedStates,
        this
      );
      const scaleColor = generateColorScale(currentColorScheme).domain([
        minValue ?? Number.NaN,
        maxValue ?? Number.NaN,
      ]);

      const data = values
        ?.filter(({ value }) => value != null)
        .map(({ location: { geometry }, value }) =>
          geometry.type === "Point"
            ? { x: geometry.coordinates[0], y: geometry.coordinates[1], value }
            : undefined
        )
        .filter(Boolean);

      const thresholds = Array.isArray(this.thresholds)
        ? this.thresholds
        : this.obtainQuantile(
            minValue ?? Number.NaN,
            maxValue ?? Number.NaN,
            this.thresholds ?? 5
          );
      (scaleColor as any)?.domain(thresholds.sort());

      const contours = tricontour()
        .x((d: { x: number }) => d.x)
        .y((d: { y: number }) => d.y)
        .value((d: { value?: number }) => d.value)
        .thresholds(thresholds)(data);

      const geojson = {
        type: "FeatureCollection",
        features: contours.map((g: GeoJSON.Geometry) => ({
          type: "Feature",
          geometry: g,
        })),
      } as GeoJSON.GeoJSON;
      const defaultStyle = {
        weight: 0,
      };

      this.#contourLayerInstance?.clearLayers();
      this.#contourLayerInstance?.addData(geojson);
      this.#contourLayerInstance?.setStyle(({ geometry }: any) => ({
        ...defaultStyle,
        color: (scaleColor as any)(geometry["value"]) as any,
        opacity: 0.5,
      }));
    }, this);
  }

  // TODO this is copied from GeoJSON layer plugin
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

  // TODO this is copied from GeoJSON layer plugin
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

  private obtainQuantile(min: number, max: number, count: number) {
    // check if parameters are valid numbers
    if (isNaN(min) || isNaN(max) || isNaN(count)) {
      throw Error("Invalid input");
    }
    // check if count is positive integer
    if (count < 1 || !Number.isInteger(count)) {
      throw Error("Count must be positive integer");
    }
    // create an empty array to store quantiles
    let result = [];
    // calculate the interval size between quantiles
    let interval = (max - min) / count;
    // loop through count times and push quantiles to result array
    for (let i = 1; i < count; i++) {
      result.push(min + i * interval);
    }
    // return result array
    return result;
  }

  private findNearestLocation(
    point: { x: number; y: number },
    locations: Location[]
  ) {
    let nearestLocation: Location | undefined;
    let shortestDistance = Infinity;

    locations?.forEach((location) => {
      if (location.geometry.type !== "Point") {
        return;
      }
      const locationPoint = {
        x: location.geometry.coordinates[0],
        y: location.geometry.coordinates[1],
      };
      const distance = Math.sqrt(
        Math.pow(locationPoint.x - point.x, 2) +
          Math.pow(locationPoint.y - point.y, 2)
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestLocation = location;
      }
    });
    return nearestLocation;
  }
}
