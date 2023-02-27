import type {
  GWFVisPlugin,
  GWFVisPluginWithSharedStates,
  SharedStates,
} from "gwf-vis-host";
import type {
  DimensionValueDict,
  GWFVisDefaultPluginSharedStates,
  GWFVisDefaultPluginWithData,
} from "../utils/basic";
import type { VariableWithDimensions, Dimension } from "../utils/data";

import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { QueryExecResult } from "sql.js";
import { obtainAvailableVariables } from "../utils/data";

export default class GWFVisPluginVariableControl
  extends LitElement
  implements
    GWFVisPlugin,
    GWFVisPluginWithSharedStates,
    GWFVisDefaultPluginWithData
{
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }

    #dimension-control-container {
      max-height: 10em;
      overflow-y: auto;
    }

    select {
      max-width: 20em;
    }
  `;

  updateSharedStatesDelegate?: (sharedStates: SharedStates) => void;
  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
    | undefined;

  private get currentVariable() {
    return this.currentAvailableVariables?.find(
      (variable) => variable.id === this.currentVariableId
    );
  }

  @state() get currentDataSource() {
    return this.sharedStates?.["gwf-default.currentDataSource"];
  }
  set currentDataSource(value: string | undefined) {
    if (!this.sharedStates) {
      return;
    }
    const oldValue = this.currentDataSource;
    this.sharedStates["gwf-default.currentDataSource"] = value;
    this.updateCurrentAvailableVariables();
    this.currentVariableId = undefined;
    this.requestUpdate("currentDataSource", oldValue);
  }

  @state() get currentVariableId() {
    return this.sharedStates?.["gwf-default.currentVariableId"];
  }
  set currentVariableId(value: number | undefined) {
    if (!this.sharedStates) {
      return;
    }
    const oldValue = this.currentVariableId;
    this.sharedStates["gwf-default.currentVariableId"] = value;
    this.updateCurrentAvailableDimensions();
    this.requestUpdate("currentVariableId", oldValue);
  }

  @state() currentAvailableVariables?: VariableWithDimensions[];

  @state() currentAvailableDimensions?: Dimension[];

  @state() get dimensionValueDict() {
    if (!this.sharedStates) {
      return;
    }
    let dimensionValueDict =
      this.sharedStates["gwf-default.dimensionValueDict"];
    if (!dimensionValueDict) {
      dimensionValueDict = this.sharedStates["gwf-default.dimensionValueDict"] =
        {};
    }
    return dimensionValueDict;
  }
  set dimensionValueDict(value: DimensionValueDict | undefined) {
    if (!this.sharedStates) {
      return;
    }
    this.sharedStates["gwf-default.dimensionValueDict"] = value;
    this.updateSharedStatesDelegate?.({ ...this.sharedStates });
  }

  @property() sharedStates?: GWFVisDefaultPluginSharedStates;
  @property() header?: string;
  @property() dataSources?: string[];
  @property() dataSourceDict?: { [name: string]: string };

  obtainHeaderCallback = () => this.header ?? "Variable Control";

  hostFirstLoadedCallback() {}

  render() {
    return html`
      <div>
        <label>Data Source: </label>
        <select
          title=${ifDefined(this.currentDataSource)}
          @change=${({ currentTarget }: Event) =>
            (this.currentDataSource = (
              currentTarget as HTMLSelectElement
            )?.value)}
        >
          <option value="" ?selected=${!this.currentDataSource}></option>
          ${map(
            this.dataSources,
            (dataSource) =>
              html`<option
                value=${dataSource}
                ?selected=${dataSource === this.currentDataSource}
              >
                ${this.obtainDataSourceDisplayName(dataSource)}
              </option>`
          )}
        </select>
      </div>
      <hr />
      <div>
        <label>Variable: </label>
        <select
          @change=${({ currentTarget }: Event) =>
            (this.currentVariableId = +(currentTarget as HTMLSelectElement)
              ?.value)}
        >
          <option value="" ?selected=${!this.currentVariableId}></option>
          ${map(
            this.currentAvailableVariables,
            ({ name, id }) =>
              html`<option
                value=${id}
                ?selected=${id === this.currentVariableId}
              >
                ${name}
              </option>`
          )}
        </select>
      </div>
      <hr />
      <div id="dimension-control-container">
        <table>
          ${map(this.currentAvailableDimensions, ({ id, name, size }) => {
            const value = this.obtainDimensionValue(
              this.currentDataSource,
              this.currentVariableId,
              id
            );
            return html`
              <tr>
                <td>
                  <b>${name}</b>
                </td>
                <td>
                  <i>(${value})</i>
                </td>
                <td>0</td>
                <td>
                  <input
                    type="range"
                    min="0"
                    max=${size - 1}
                    .value=${value?.toString() ?? "N/A"}
                    title=${value ?? "N/A"}
                    @change=${({ currentTarget }: Event) =>
                      this.assignDimensionValue(
                        this.currentDataSource,
                        this.currentVariableId,
                        id,
                        +((currentTarget as HTMLInputElement)?.value ?? 0)
                      )}
                  />
                </td>
                <td>${size - 1}</td>
              </tr>
            `;
          })}
        </table>
      </div>
    `;
  }

  private obtainDimensionValue(
    dataSource?: string,
    variableId?: number,
    dimensionId?: number
  ) {
    if (!this.dimensionValueDict) {
      return;
    }
    if (!dataSource || variableId == null || dimensionId == null) {
      return;
    }
    let value =
      this.dimensionValueDict[dataSource]?.[variableId]?.[dimensionId];
    return value;
  }

  private assignDimensionValue(
    dataSource?: string,
    variableId?: number,
    dimensionId?: number,
    value?: number,
    silent: boolean = false
  ) {
    if (!this.dimensionValueDict) {
      this.dimensionValueDict = {};
    }
    if (!dataSource || variableId == null || dimensionId == null) {
      return;
    }
    let dictForDataSource = this.dimensionValueDict[dataSource];
    if (!dictForDataSource) {
      dictForDataSource = this.dimensionValueDict[dataSource] = {};
    }
    let dictForVariable = dictForDataSource[variableId];
    if (!dictForVariable) {
      dictForVariable = dictForDataSource[variableId] = {};
    }
    dictForVariable[dimensionId] = value;
    if (!silent) {
      this.dimensionValueDict = { ...this.dimensionValueDict };
    }
    return value;
  }

  private async updateCurrentAvailableVariables() {
    const dataSource = this.currentDataSource;
    if (!dataSource) {
      this.currentAvailableVariables = undefined;
      return;
    }
    const variables = await obtainAvailableVariables(dataSource, this);
    this.currentAvailableVariables = variables;
  }

  private updateCurrentAvailableDimensions() {
    if (!this.currentDataSource || !this.currentVariableId) {
      this.currentAvailableDimensions = undefined;
      return;
    }
    this.currentAvailableDimensions = this.currentVariable?.dimensions;
    this.initializeCurrentDimensionValuesIfNotYetInitialized();
  }

  private initializeCurrentDimensionValuesIfNotYetInitialized() {
    this.currentAvailableDimensions?.forEach((dimension) => {
      let value = this.obtainDimensionValue(
        this.currentDataSource,
        this.currentVariableId,
        dimension.id
      );
      if (!value) {
        value = this.assignDimensionValue(
          this.currentDataSource,
          this.currentVariableId,
          dimension.id,
          0,
          true
        );
      }
    });
    this.dimensionValueDict = { ...this.dimensionValueDict };
  }

  private obtainDataSourceDisplayName(dataSource?: string) {
    if (!dataSource) {
      return;
    }
    return Object.entries(this.dataSourceDict ?? {}).find(
      ([_, source]) => dataSource === source
    )?.[0];
  }
}
