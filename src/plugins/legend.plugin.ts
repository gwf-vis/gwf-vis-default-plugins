import {
  type ScaleQuantile,
  type ScaleQuantize,
  type ScaleThreshold,
} from "d3";
import type { VGAPlugin, VGAPluginWithData } from "vga-core";
import type { ColorSchemeDefinition } from "../utils/color";
import type { DataFrom, GWFVisDBQueryObject, Variable } from "../utils/data";
import type { DataSourceNameDict } from "../utils/data-source-name-dict";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { html, LitElement, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { choose } from "lit/directives/choose.js";
import { map } from "lit/directives/map.js";
import { when } from "lit/directives/when.js";
import { generateColorScale, generateGradientCSSString } from "../utils/color";
import {
  obtainCurrentColorScheme,
  obtainCurrentDataSource,
  obtainCurrentVariable,
} from "../utils/state";
import { obtainDataSourceDisplayName } from "../utils/data-source-name-dict";

type Info = {
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

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements VGAPlugin, VGAPluginWithData<GWFVisDBQueryObject, any> {
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
  enableSecondaryVariable?: boolean;
  secondaryDataFrom?: DataFrom;
  enableTertiaryVariable?: boolean;
  tertiaryDataFrom?: DataFrom;
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  };

  @state() info?: Info;
  @state() infoSecondary?: Info;
  @state() infoTertiary?: Info;

  @property() sharedStates?: GWFVisDefaultPluginSharedStates;
  @property() fractionDigits: number = 2;
  @property() dataSourceDict?: DataSourceNameDict;

  obtainHeaderCallback = () => this.header ?? "Legend";

  async updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.size === 1 &&
      (changedProperties.has("info") ||
        changedProperties.has("infoSecondary") ||
        changedProperties.has("infoTertiary"))
    ) {
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

        scaleColor.domain([
          min ?? Number.NEGATIVE_INFINITY,
          max ?? Number.POSITIVE_INFINITY,
        ]);
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

    // TODO refactor
    if (this.enableSecondaryVariable) {
      const currentVariable = await obtainCurrentVariable(
        currentDataSource,
        this.secondaryDataFrom,
        this.sharedStates,
        "secondary",
        this
      );
      if (currentVariable) {
        const currentColorScheme = await obtainCurrentColorScheme(
          currentDataSource,
          currentVariable,
          this.secondaryDataFrom,
          this.colorScheme,
          this.sharedStates,
          "secondary",
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

            this.infoSecondary = {
              currentDataSource,
              currentVariable,
              currentColorScheme,
              colorScale: scaleColor,
            };
            break;
          }
          case "threshold":
            this.infoSecondary = {
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

            scaleColor.domain([
              min ?? Number.NEGATIVE_INFINITY,
              max ?? Number.POSITIVE_INFINITY,
            ]);
            this.infoSecondary = {
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
      } else {
        this.infoSecondary = undefined;
      }

      // TODO refactor
      if (this.enableTertiaryVariable) {
        const currentVariable = await obtainCurrentVariable(
          currentDataSource,
          this.tertiaryDataFrom,
          this.sharedStates,
          "tertiary",
          this
        );
        if (currentVariable) {
          const { max, min } =
            ((await this.queryDataDelegate?.(currentDataSource ?? "", {
              for: "max-min-value",
              filter: {
                variables: currentVariable ? [currentVariable.id] : undefined,
              },
            })) as { max?: number; min?: number }) ?? {};
          this.infoTertiary = { min, max, currentDataSource, currentVariable };
        } else {
          this.infoTertiary = undefined;
        }
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
        ${when(this.info, () =>
      choose(
        this.info?.currentColorScheme?.type,
        [
          ["sequential", () => this.renderSequential(this.info)],
          ["quantile", () => this.renderNonSequential(this.info)],
          ["quantize", () => this.renderNonSequential(this.info)],
          ["threshold", () => this.renderNonSequential(this.info)],
        ],
        () => this.renderSequential(this.info)
      )
    )}
        ${when(
      this.enableSecondaryVariable,
      () => html` <div>
              <b>Variable: </b>
              ${this.infoSecondary?.currentVariable?.name ?? "N/A"}
            </div>
            ${when(this.infoSecondary, () =>
        choose(
          this.infoSecondary?.currentColorScheme?.type,
          [
            [
              "sequential",
              () => this.renderSequential(this.infoSecondary),
            ],
            [
              "quantile",
              () => this.renderNonSequential(this.infoSecondary),
            ],
            [
              "quantize",
              () => this.renderNonSequential(this.infoSecondary),
            ],
            [
              "threshold",
              () => this.renderNonSequential(this.infoSecondary),
            ],
          ],
          () => this.renderSequential(this.infoSecondary)
        )
      )}`
    )}
        ${when(
      this.enableTertiaryVariable,
      () => html` <div>
              <b>Variable: </b>
              ${this.infoTertiary?.currentVariable?.name ?? "N/A"}
            </div>
            ${when(
        this.infoTertiary,
        () =>
          `[${this.infoTertiary?.min?.toFixed(2) ?? "N/A"}, ${this.infoTertiary?.max?.toFixed(2) ?? "N/A"
          }]`
      )}`
    )}
      </div>
    `;
  }

  private renderNonSequential(info?: Info) {
    let colorScale = info?.colorScale as
      | ScaleQuantize<any>
      | ScaleQuantile<any, never>
      | ScaleThreshold<number, any, never>
      | undefined;
    if (!colorScale) {
      return;
    }
    const extents = colorScale
      .range()
      .map((color) => colorScale!.invertExtent(color));
    const ticks =
      extents?.length > 0
        ? [
          extents.at(0)?.[0],
          ...extents.map((extent) => extent[1]).slice(0, -1),
          extents.at(-1)?.[1],
        ]
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
                ${Number.isFinite(tick)
              ? tick?.toFixed(this.fractionDigits)
              : "~"}
              </div>`
      )}
        </div>
      </div>
    `;
  }

  private renderSequential(info?: Info) {
    return html`
      <div>
        <div
          style="height: 1em; background: ${generateGradientCSSString(
      info?.colorScale,
      info?.min,
      info?.max
    )};"
        ></div>
        <div style="display: flex; flex-wrap: nowrap;">
          <div style="flex: 0 0 auto; white-space: nowrap;">
            ${info?.min?.toFixed(this.fractionDigits) ?? "N/A"}
          </div>
          <div style="flex: 1;"></div>
          <div style="flex: 0 0 auto; white-space: nowrap;">
            ${info?.max?.toFixed(this.fractionDigits) ?? "N/A"}
          </div>
        </div>
      </div>
    `;
  }
}
