import type { ScaleQuantize } from "d3";
import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import type { ColorSchemeDefinition } from "../utils/color";
import type { DataFrom, Variable } from "../utils/data";
import type { DataSourceNameDict } from "../utils/data-source-name-dict";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { html, LitElement, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { when } from "lit/directives/when.js";
import { generateColorScale, generateGradientCSSString } from "../utils/color";
import {
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
  obtainMaxAndMinForVariable,
} from "../utils/data";
import { obtainDataSourceDisplayName } from "../utils/data-source-name-dict";

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements
    GWFVisPlugin,
    GWFVisPluginWithData<string, initSqlJs.QueryExecResult | undefined>
{
  hostFirstLoadedCallback?: (() => void) | undefined;
  notifyLoadingDelegate?: (() => () => void) | undefined;
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
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
    const { max, min } =
      (await obtainMaxAndMinForVariable(
        currentDataSource,
        currentVariable?.id,
        this
      )) ?? {};
    const currentColorScheme = await obtainCurrentColorScheme(
      currentDataSource,
      currentVariable,
      this.dataFrom,
      this.colorScheme,
      this.sharedStates,
      this
    );
    const colorScale = generateColorScale(currentColorScheme);
    this.info = {
      min,
      max,
      currentDataSource,
      currentVariable,
      currentColorScheme,
      colorScale,
    };
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
      ${when(
        this.info?.currentColorScheme?.type === "quantize",
        () => this.renderQuantize(),
        () => this.renderSequential()
      )}
    `;
  }

  private renderQuantize() {
    const colorScale = this.info?.colorScale as ScaleQuantize<any> | undefined;
    if (!colorScale) {
      return;
    }
    const extents = colorScale
      .range()
      .map((color) => colorScale.invertExtent(color));
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
