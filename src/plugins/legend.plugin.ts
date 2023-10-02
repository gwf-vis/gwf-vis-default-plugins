import {
  color,
  type ScaleQuantile,
  type ScaleQuantize,
  type ScaleThreshold,
} from "d3";
import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { ColorSchemeDefinition } from "../utils/color";
import type { DataFrom, GWFVisDBQueryObject, Variable } from "../utils/data";
import type { DataSourceNameDict } from "../utils/data-source-name-dict";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { html, LitElement, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { choose } from "lit/directives/choose.js";
import { map } from "lit/directives/map.js";
import { generateColorScale, generateGradientCSSString } from "../utils/color";
import {
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
} from "../utils/state";
import { obtainDataSourceDisplayName } from "../utils/data-source-name-dict";

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements GWFVisPlugin, GWFVisPluginWithData<GWFVisDBQueryObject, any>
{
  hostFirstLoadedCallback?: (() => void) | undefined;
  notifyLoadingDelegate?: (() => () => void) | undefined;
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((dataSource: string, queryObject: GWFVisDBQueryObject) => Promise<any>)
    | undefined;

  header?: string;
  dataFrom?: DataFrom;
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  };

  @state() info?: {
    currentDataSource?: string;
    currentVariable?: Variable;
    colorScale?: (value: number) => any;
    min?: number;
    max?: number;
    currentColorScheme?:
      | { [variable: string]: ColorSchemeDefinition }
      | ColorSchemeDefinition
      | undefined;
  };

  @property() sharedStates?: GWFVisDefaultPluginSharedStates;
  @property() fractionDigits: number = 2;
  @property() dataSourceDict?: DataSourceNameDict;

  obtainHeaderCallback = () => this.header ?? "Legend";

  async updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.size === 1 && changedProperties.has("info")) {
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
    const currentColorScheme = await obtainCurrentColorScheme(
      currentDataSource,
      currentVariable,
      this.dataFrom,
      this.colorScheme,
      this.sharedStates,
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
        scaleColor.domain(allValues);

        this.info = {
          currentDataSource,
          currentVariable,
          currentColorScheme,
          colorScale: scaleColor,
        };
        break;
      }
      case "threshold":
        this.info = {
          currentDataSource,
          currentVariable,
          currentColorScheme,
          colorScale: scaleColor,
        };
        break;
      default: {
        const { max, min } =
          ((await this.queryDataDelegate?.(currentDataSource ?? "", {
            for: "max-min-value",
            filter: {
              variables: currentVariable ? [currentVariable.id] : undefined,
            },
          })) as { max?: number; min?: number }) ?? {};
        if (max == null && min == null) {
          return;
        }
        scaleColor.domain([min, max]);
        this.info = {
          min,
          max,
          currentDataSource,
          currentVariable,
          currentColorScheme,
          colorScale: scaleColor,
        };
        break;
      }
    }
  }

  render() {
    return html`
      <div part="content">
        <div>
          <b>Data Source: </b>
          ${obtainDataSourceDisplayName(
            this.info?.currentDataSource,
            this.dataSourceDict
          ) ?? "N/A"}
        </div>
        <div>
          <b>Variable: </b>
          ${this.info?.currentVariable?.name ?? "N/A"}
        </div>
      </div>
      ${choose(this.info?.currentColorScheme?.type, [
        ["sequential", () => this.renderSequential()],
        ["quantile", () => this.renderNonSequential()],
        ["quantize", () => this.renderNonSequential()],
        ["threshold", () => this.renderNonSequential(true)],
      ])}
    `;
  }

  private renderNonSequential(isThreshold?: boolean) {
    let colorScale = this.info?.colorScale as
      | ScaleQuantize<any>
      | ScaleQuantile<any, never>
      | (ScaleThreshold<number, any, never> & { minValue: number })
      | undefined;
    if (!colorScale) {
      return;
    }
    const extents = colorScale
      .range()
      .map((color) => colorScale!.invertExtent(color));
    if (
      (colorScale as ScaleThreshold<number, any, never> & { minValue: number })
        .minValue != null
    ) {
      const item = extents[0];
      if (item) {
        item[0] = (
          colorScale as ScaleThreshold<number, any, never> & {
            minValue: number;
          }
        ).minValue;
      }
    }
    const ticks =
      extents?.length > 0
        ? [extents[0][0], ...extents.map((extent) => extent[1])]
        : undefined;
    return html`
      <div>
        <div
          style="display: flex; flex-wrap: nowrap; height: 1em; margin: 0 ${(0.5 /
            (ticks?.length ?? 1)) *
          100}%;"
        >
          ${map(
            colorScale?.range(),
            (color) =>
              html`<div
                style="flex: 1; height: 100%; background: ${color ?? ""}"
              ></div>`
          )}
        </div>
        <div style="display: flex; flex-wrap: nowrap;">
          ${map(
            ticks,
            (tick) =>
              html`<div
                style="flex: 1; height: 100%; margin: 0 0.5em; text-align: center;"
              >
                ${tick?.toFixed(this.fractionDigits)}
              </div>`
          )}
        </div>
      </div>
    `;
  }

  private renderSequential() {
    return html`
      <div>
        <div
          style="height: 1em; background: ${generateGradientCSSString(
            this.info?.colorScale
          )};"
        ></div>
        <div style="display: flex; flex-wrap: nowrap;">
          <div style="flex: 0 0 auto; white-space: nowrap;">
            ${this.info?.min?.toFixed(this.fractionDigits) ?? "N/A"}
          </div>
          <div style="flex: 1;"></div>
          <div style="flex: 0 0 auto; white-space: nowrap;">
            ${this.info?.max?.toFixed(this.fractionDigits) ?? "N/A"}
          </div>
        </div>
      </div>
    `;
  }
}
