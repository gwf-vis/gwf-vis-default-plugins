import type {
  VGAPlugin,
  VGAPluginWithData,
  VGAPluginWithSharedStates,
} from "vga-core";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import Chart, { PointElement } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import { css, html, LitElement } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { state } from "lit/decorators.js";
import { LocationPin, runAsyncWithLoading } from "../utils/basic";
import { Dimension, GWFVisDBQueryObject, Value, Variable } from "../utils/data";

type DataForBase = {
  dataSource: string;
  dimensionName: string;
};

type DataForVariable = DataForBase & {
  variableName: string;
  locationIds?: number[];
};

type DataForLocation = DataForBase & {
  locationId?: number;
  variableNames?: string[];
};
type DataFor = DataForVariable | DataForLocation;

const DEFAULT_COLORS = [
  "#8CC63E",
  "#2989E3",
  "#724498",
  "#F02C89",
  "#FB943B",
  "#F4CD26",
];

const FALLBACK_VALUE = Number.NaN;

const VERTICLE_LINE_CHART_PLUGIN = {
  afterDraw: (chart: Chart) => {
    if ((chart.tooltip as any)?._active?.length) {
      let x = (chart.tooltip as any)._active[0].element.x;
      let yAxis = chart.scales.y;
      let ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "hsl(0, 100%, 50%)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

export default class GWFVisPluginLineChart
  extends LitElement
  implements
  VGAPlugin,
  VGAPluginWithSharedStates,
  VGAPluginWithData<GWFVisDBQueryObject, any> {
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }

    #main-container {
      position: relative;
      height: 100%;
      width: 100%;
    }
  `;

  updateSharedStatesDelegate?:
    | ((sharedStates: GWFVisDefaultPluginSharedStates) => void)
    | undefined;
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((dataSource: string, queryObject: GWFVisDBQueryObject) => Promise<any>)
    | undefined;
  checkIfPluginIsInTheLargePresenterDelegate?: (() => boolean) | undefined;

  #canvasRef = createRef<HTMLCanvasElement>();
  #chart?: Chart;

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    const locationSelection =
      this.#sharedStates?.["gwf-default.locationSelection"];
    if (!locationSelection) {
      return;
    }
    if (this.#canvasRef.value) {
      this.drawChart(this.#canvasRef.value);
    }
  }

  get actualDataSource() {
    return (
      this.dataFor?.dataSource ||
      this.#sharedStates?.["gwf-default.locationSelection"]?.dataSource
    );
  }

  get actualDimension() {
    return this.#availableDimensions?.find(
      (dimension) => dimension.name === this.dataFor?.dimensionName
    );
  }

  #availableVariables?: Variable[];
  #availableDimensions?: Dimension[];

  header = "Line Chart";
  dataFor?: DataFor;
  // TODO height?: string;
  // TODO width?: string;
  locationLabelKey?: string;

  @state() metadata?: Record<string, any>;

  obtainHeaderCallback = () => this.header;

  async firstUpdated() {
    const dataSource = this.actualDataSource;
    if (dataSource) {
      this.#availableVariables = (await this.queryDataDelegate?.(dataSource, {
        for: "variables",
      })) as Variable[];
      this.#availableDimensions = (await this.queryDataDelegate?.(dataSource, {
        for: "dimensions",
      })) as Dimension[];
    }
    if (this.#canvasRef.value) {
      this.drawChart(this.#canvasRef.value);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.checkIfPluginIsInTheLargePresenterDelegate?.()) {
      this.style.height = "100%";
    } else {
      this.style.height = "300px";
    }
  }

  constructor() {
    super();
    Chart.register(zoomPlugin);
  }

  render() {
    return html`
      <div id="main-container"><canvas ${ref(this.#canvasRef)}></canvas></div>
    `;
  }

  async obtainChartDatasets() {
    const dataSource = this.actualDataSource;
    if (!dataSource) {
      return [];
    }
    if (!this.dataFor) {
      return [];
    }
    const dimension = this.actualDimension;
    if (!dimension) {
      return [];
    }

    let values: Value[] = [];
    let datasets: any[] = [];

    switch (this.dataFor?.hasOwnProperty("variableName")) {
      case true: {
        const dataFor = this.dataFor as DataForVariable;
        const locations =
          dataFor.locationIds?.map((locationId, i) => ({
            id: locationId,
            color: DEFAULT_COLORS[i] ?? "hsl(0, 0%, 0%)",
          })) ??
          this.sharedStates?.["gwf-default.locationPins"]
            ?.filter(
              (pin: LocationPin) => pin.dataSource === dataSource && pin.locationId != null
            )
            .map(({ locationId, color }: LocationPin) => ({
              id: locationId as number,
              color: color ?? "hsl(0, 0%, 0%)",
            })) ??
          [];
        const locationSelection =
          this.sharedStates?.["gwf-default.locationSelection"];
        if (
          locationSelection?.dataSource === dataSource &&
          locationSelection.locationId != null &&
          !locations
            ?.map((location) => location.id)
            .includes(locationSelection.locationId)
        ) {
          locations?.push({
            id: locationSelection.locationId,
            color: "hsl(0, 0%, 70%)",
          });
        }
        const variableId =
          this.#availableVariables?.find(
            (variable) => variable.name === dataFor.variableName
          )?.id ?? this.sharedStates?.["gwf-default.currentVariableId"];
        if (locations && locations.length > 0 && variableId != null) {
          const dimensionIdAndValueDict = {
            ...this.sharedStates?.["gwf-default.dimensionValueDict"]?.[
            dataSource
            ][variableId],
          };
          delete dimensionIdAndValueDict[dimension.id];
          values =
            (await this.queryDataDelegate?.(dataSource, {
              for: "values",
              filter: {
                location: locations.map((location) => location.id),
                variable: variableId,
                dimensionIdAndValueDict,
              },
            })) ?? [];
        }
        if (locations && locations.length > 0 && variableId != null) {
          datasets = await Promise.all(
            locations.map(async (location: { id: number; color: any; }) => {
              let locationLabel;
              if (this.locationLabelKey) {
                const [{ metadata }] =
                  (await this.queryDataDelegate?.(dataSource, {
                    for: "locations",
                    filter: {
                      ids: [location.id],
                    },
                  })) || [];
                if (metadata) {
                  locationLabel = metadata?.[this.locationLabelKey];
                }
              }
              return {
                label: locationLabel ?? `Location ${location.id ?? "N/A"}`,
                backgroundColor: location.color || "hsl(0, 0%, 0%)",
                borderColor: location.color || "hsl(0, 0%, 0%)",
                data: this.obtainChartDataForLocation(
                  values,
                  location.id,
                  dimension
                ),
              };
            })
          );
        }
        return datasets;
      }
      case false: {
        const dataFor = this.dataFor as DataForLocation;
        const variableIds =
          dataFor.variableNames?.map(
            (name) =>
              this.#availableVariables?.find(
                (variable) => variable.name === name
              )?.id
          ) ??
          (this.sharedStates?.["gwf-default.currentVariableId"] != null
            ? [this.sharedStates?.["gwf-default.currentVariableId"]]
            : []);
        const LocationSelection =
          this.sharedStates?.["gwf-default.locationSelection"];
        const locationId =
          dataFor.locationId ??
          (LocationSelection?.dataSource === dataSource
            ? LocationSelection.locationId
            : undefined);
        if (
          dataSource &&
          locationId != null &&
          variableIds &&
          variableIds.length > 0
        ) {
          const variables = variableIds
            .map((id) =>
              this.#availableVariables?.find((variable) => variable.id === id)
            )
            .filter(Boolean) as Variable[];
          // TODO might want to check if all variables have the same dimensions
          const dimensionIdAndValueDict = {
            ...this.sharedStates?.["gwf-default.dimensionValueDict"]?.[
            dataSource
            ][variables[0].id],
          };
          delete dimensionIdAndValueDict[dimension.id];
          values =
            (await this.queryDataDelegate?.(dataSource, {
              for: "values",
              filter: {
                location: locationId,
                variable: variables.map((variable) => variable.id),
                dimensionIdAndValueDict,
              },
            })) ?? [];
          datasets = variables?.map((variable, i) => ({
            label: variable.name,
            backgroundColor: DEFAULT_COLORS?.[i] || "hsl(0, 0%, 0%)",
            borderColor: DEFAULT_COLORS?.[i] || "hsl(0, 0%, 0%)",
            data: this.obtainChartDataForVariable(
              values,
              variable.id,
              dimension
            ),
          }));
        }
        return datasets;
      }
    }
  }

  async drawChart(canvasElement: HTMLCanvasElement) {
    await runAsyncWithLoading(async () => {
      const datasets = await this.obtainChartDatasets();
      const dimension = this.actualDimension;
      const labels = dimension?.value_labels ?? [
        ...new Array(dimension?.size || 0).keys(),
      ];
      const data = {
        labels,
        datasets,
      };

      const config = {
        type: "line",
        data: data,
        options: {
          pointRadius: 0,
          onClick: (_event: any, items: any[]) => {
            items.every((item) => {
              if (item.element instanceof PointElement) {
                const index = item.index;
                const dataSource = this.actualDataSource;
                const currentVariableId =
                  this.sharedStates?.["gwf-default.currentVariableId"];
                if (
                  !dataSource ||
                  currentVariableId == null ||
                  dimension == null
                ) {
                  return;
                }
                if (
                  confirm(
                    `Do you want to set dimension "${dimension.name}" to value "${index}"?`
                  )
                ) {
                  this.updateSharedStatesDelegate?.({
                    ...this.#sharedStates,
                    "gwf-default.dimensionValueDict": {
                      ...this.sharedStates?.["gwf-default.dimensionValueDict"],
                      [dataSource]: {
                        ...this.sharedStates?.[
                        "gwf-default.dimensionValueDict"
                        ]?.[dataSource],
                        [currentVariableId]: {
                          ...this.sharedStates?.[
                          "gwf-default.dimensionValueDict"
                          ]?.[dataSource]?.[currentVariableId],
                          [dimension.id]: index,
                        },
                      },
                    },
                  });
                }
              }
              return false;
            });
          },
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: "index",
          },
          plugins: {
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                pinch: {
                  enabled: true,
                },
                mode: "xy",
                overScaleMode: "xy",
              },
              pan: {
                enabled: true,
                mode: "xy",
                overScaleMode: "xy",
              },
            },
          },
        },
        plugins: [VERTICLE_LINE_CHART_PLUGIN],
      };
      if (this.#chart) {
        this.#chart.data = data;
        (this.#chart as any).resetZoom();
        this.#chart.update();
      } else if (datasets?.length > 0) {
        this.#chart = new Chart(canvasElement, config as any);
      }
    }, this);
  }

  private obtainChartDataForVariable(
    values: Value[],
    variableId: number,
    dimension: Dimension
  ) {
    const valuesForTheVariable = values?.filter(
      (d) => d.variable.id === variableId
    );
    for (let i = 0; i < dimension.size; i++) {
      if (
        !valuesForTheVariable?.find(
          (d) => d.dimensionIdAndValueDict[dimension.id] === i
        )
      ) {
        const itemToBeInserted = {
          value: FALLBACK_VALUE,
          dimensionIdAndValueDict: {} as {
            [dimensionId: number]: number | null;
          },
        };
        itemToBeInserted.dimensionIdAndValueDict[dimension.id] = i;
        valuesForTheVariable?.splice(i, 0, itemToBeInserted as Value);
      }
    }
    return valuesForTheVariable
      ?.sort(
        (a, b) =>
          (a.dimensionIdAndValueDict[dimension.id] ?? Number.NaN) -
          (b.dimensionIdAndValueDict[dimension.id] ?? Number.NaN)
      )
      .map((d) => d.value);
  }

  private obtainChartDataForLocation(
    values: Value[],
    locationId: number,
    dimension: Dimension
  ) {
    const valuesForTheLocation = values?.filter(
      (d) => d.location?.id.toString() === locationId.toString()
    );
    for (let i = 0; i < dimension.size; i++) {
      if (
        !valuesForTheLocation?.find(
          (d) => d.dimensionIdAndValueDict[dimension.id] === i
        )
      ) {
        const itemToBeInserted = {
          value: FALLBACK_VALUE,
          dimensionIdAndValueDict: {} as {
            [dimensionId: number]: number | null;
          },
        };
        itemToBeInserted.dimensionIdAndValueDict[dimension.id] = i;
        valuesForTheLocation?.splice(i, 0, itemToBeInserted as Value);
      }
    }
    return valuesForTheLocation
      ?.sort(
        (a, b) =>
          (a.dimensionIdAndValueDict[dimension.id] ?? Number.NaN) -
          (b.dimensionIdAndValueDict[dimension.id] ?? Number.NaN)
      )
      .map((d) => d.value);
  }
}
