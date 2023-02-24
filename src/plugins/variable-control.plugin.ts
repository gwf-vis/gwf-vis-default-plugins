import type {
  GWFVisPlugin,
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
  SharedStates,
} from "gwf-vis-host";
import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { QueryExecResult } from "sql.js";

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
  `;

  sharedStates?: SharedStates;
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

  @state() currentDataSourceVariables?: { name: string; id: number }[] = [
    { name: "fake A", id: 0 },
    { name: "fake B", id: 1 },
  ];
  @state() currentVariableDimensions?: {
    name: string;
    id: number;
    size: number;
  }[] = [
    { name: "fake one", id: 0, size: 100 },
    { name: "fake two", id: 1, size: 50 },
  ];
  @state() currentDimensionValueDict?: Record<string, number>;

  @property() header?: string;
  @property() dataSources?: string[];

  render() {
    return html`
      <div>
        <label>Data Source: </label>
        <select>
          ${map(
            this.dataSources,
            (dataSource) => html`<option>${dataSource}</option>`
          )}
        </select>
      </div>
      <hr />
      <div>
        <label>Variable: </label>
        <select>
          ${map(
            this.currentDataSourceVariables,
            ({ name, id }) => html`<option value=${id}>${name}</option>`
          )}
        </select>
      </div>
      <hr />
      <div id="dimension-control-container">
        <table>
          ${map(this.currentVariableDimensions, ({ name, size }) => {
            const value = this.obtainDimensionValue(name);
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
                    value=${value}
                    title=${value}
                    @change=${({ currentTarget }: Event) =>
                      this.assignDimensionValue(
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

  private obtainDimensionValue(dimensionName: string) {
    if (!this.currentDimensionValueDict) {
      this.currentDimensionValueDict = {};
    }
    let value = this.currentDimensionValueDict?.[dimensionName];
    if (!value) {
      value = this.currentDimensionValueDict[dimensionName] = 0;
    }
    return value;
  }

  private assignDimensionValue(dimensionName: string, value: number) {
    if (!this.currentDimensionValueDict) {
      this.currentDimensionValueDict = {};
    }
    this.currentDimensionValueDict[dimensionName] = value;
    this.currentDimensionValueDict = { ...this.currentDimensionValueDict };
  }
}
