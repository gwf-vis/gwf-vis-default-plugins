import type {
  GWFVisPlugin,
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
  SharedStates,
} from "gwf-vis-host";
import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { QueryExecResult, SqlValue } from "sql.js";

type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

type Dimension = {
  id: number;
  name: string;
  size: number;
  description?: string;
  value_labels?: string[];
};

type DimensionValueDict = {
  [dataSource: string]: {
    [variableId: number]: {
      [dimensionName: string]: number | undefined;
    };
  };
};

export default class GWFVisPluginVariableControl
  extends LitElement
  implements
    GWFVisPlugin,
    GWFVisPluginWithSharedStates,
    GWFVisPluginWithData<string, initSqlJs.QueryExecResult | undefined>
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

  updateSharedStatesCallback?: (sharedStates: SharedStates) => void;

  obtainHeader = () => this.header ?? "Variable Control";
  checkIfDataProviderRegisteredCallback?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataCallback?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
    | undefined;

  #currentDataSource?: string;
  @state() get currentDataSource() {
    return this.#currentDataSource;
  }
  set currentDataSource(value: string | undefined) {
    const oldValue = this.#currentDataSource;
    this.#currentDataSource = value;
    this.updateCurrentAvailableVariables();
    this.currentVariableId = undefined;
    this.requestUpdate("currentDataSource", oldValue);
  }

  #currentVariableId?: number;
  @state() get currentVariableId() {
    return this.#currentVariableId;
  }
  set currentVariableId(value: number | undefined) {
    const oldValue = this.#currentVariableId;
    this.#currentVariableId = value;
    this.updateCurrentAvailableDimensions();
    this.requestUpdate("currentVariableId", oldValue);
  }

  @state() currentAvailableVariables?: Variable[];

  @state() currentAvailableDimensions?: Dimension[];

  // #dimensionValueDict?: DimensionValueDict;
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
    this.updateSharedStatesCallback?.({ ...this.sharedStates });
  }

  @property() sharedStates?: SharedStates & {
    "gwf-default.dimensionValueDict"?: DimensionValueDict;
  };
  @property() header?: string;
  @property() dataSources?: string[];
  @property() dataSourceDict?: { [name: string]: string };

  hostFirstLoadedHandler() {}

  render() {
    return html`
      <div>
        <label>Data Source: </label>
        <select
          title=${ifDefined(this.#currentDataSource)}
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
          ${map(this.currentAvailableDimensions, ({ name, size }) => {
            const value = this.obtainDimensionValue(
              this.currentDataSource,
              this.currentVariableId,
              name
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
                        name,
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
    dimensionName?: string
  ) {
    if (!this.dimensionValueDict) {
      return;
    }
    if (!dataSource || variableId == null || !dimensionName) {
      return;
    }
    let value =
      this.dimensionValueDict[dataSource]?.[variableId]?.[dimensionName];
    return value;
  }

  private assignDimensionValue(
    dataSource?: string,
    variableId?: number,
    dimensionName?: string,
    value?: number,
    silent: boolean = false
  ) {
    if (!this.dimensionValueDict) {
      this.dimensionValueDict = {};
    }
    if (!dataSource || variableId == null || !dimensionName) {
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
    dictForVariable[dimensionName] = value;
    if (!silent) {
      this.dimensionValueDict = { ...this.dimensionValueDict };
    }
    return value;
  }

  private async updateCurrentAvailableVariables() {
    if (!this.currentDataSource) {
      this.currentAvailableVariables = undefined;
      return;
    }
    const sql = `SELECT id, name, unit, description FROM variable`;
    const sqlResult = await this.queryDataCallback?.(
      this.currentDataSource,
      sql
    );
    const result = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => [
            sqlResult.columns?.[columnIndex],
            value,
          ])
        ) as Variable
    );
    this.currentAvailableVariables = result;
  }

  private async updateCurrentAvailableDimensions() {
    if (!this.currentDataSource || !this.currentVariableId) {
      this.currentAvailableDimensions = undefined;
      return;
    }
    const sql = `
      SELECT 
        dimension.* 
      FROM 
        dimension, variable_dimension 
      WHERE 
        variable_dimension.variable = ${this.currentVariableId} AND dimension.id = variable_dimension.dimension
    `;
    const sqlResult = await this.queryDataCallback?.(
      this.currentDataSource,
      sql
    );
    const result = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => {
            const columnName = sqlResult.columns?.[columnIndex];
            if (columnName === "value_labels") {
              value = value ? JSON.parse(value as string) : undefined;
            }
            return [columnName, value as SqlValue | string[]];
          })
        ) as Dimension
    );
    this.currentAvailableDimensions = result;
    this.initializeCurrentDimensionValuesIfNotYetInitialized();
  }

  private initializeCurrentDimensionValuesIfNotYetInitialized() {
    this.currentAvailableDimensions?.forEach((dimension) => {
      let value = this.obtainDimensionValue(
        this.currentDataSource,
        this.currentVariableId,
        dimension.name
      );
      if (!value) {
        value = this.assignDimensionValue(
          this.currentDataSource,
          this.currentVariableId,
          dimension.name,
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
