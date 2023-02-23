import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import { css, html, LitElement } from "lit";
import { map } from "lit/directives/map.js";
import { createRef, ref } from "lit/directives/ref.js";
import { state } from "lit/decorators.js";

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements
    GWFVisPlugin,
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

    table,
    th,
    td {
      border: 1px solid black;
      border-collapse: collapse;
    }
  `;

  #dataSourceInputRef = createRef<HTMLInputElement>();
  #sqlTextareaRef = createRef<HTMLTextAreaElement>();
  #resultContainer = createRef<HTMLDivElement>();

  @state() queryResult?: QueryExecResult;

  obtainHeader = () => "Test Data Fetcher";
  checkIfDataProviderRegisteredCallback?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataCallback?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
    | undefined;

  render() {
    return html`
      <label>Data source:</label>
      <gwf-vis-ui-input
        type="text"
        placeholder="Enter your data source..."
        value="sqlite-local:https://raw.githubusercontent.com/codecrafters-io/sample-sqlite-databases/master/superheroes.db"
        style="width: 100%;"
        ${ref(this.#dataSourceInputRef)}
      ></gwf-vis-ui-input>
      <br />
      <label>SQL query:</label>
      <textarea
        placeholder="Enter your SQL..."
        style="width: 100%;"
        .value=${"SELECT * FROM superheroes LIMIT 10"}
        ${ref(this.#sqlTextareaRef)}
      ></textarea>
      <br />
      <gwf-vis-ui-button @click=${this.queryData}>Query Data</gwf-vis-ui-button>
      <gwf-vis-ui-collapse>
        <h3 slot="header">Queried data</h3>
        <div
          style="max-height: 15em; width: 100%; overflow: auto;"
          ${ref(this.#resultContainer)}
        >
          <table>
            <tr>
              ${map(
                this.queryResult?.columns,
                (column) => html`<th>${column}</th>`
              )}
            </tr>
            ${map(
              this.queryResult?.values,
              (row) =>
                html`<tr>
                  ${map(row, (column) => html`<td>${column}</td>`)}
                </tr>`
            )}
          </table>
        </div>
      </gwf-vis-ui-collapse>
    `;
  }

  private async queryData() {
    if (this.checkIfDataProviderRegisteredCallback?.("sqlite-local")) {
      const dataSource = this.#dataSourceInputRef.value?.value;
      const sql = this.#sqlTextareaRef.value?.value;
      if (dataSource && sql) {
        this.queryResult = await this.queryDataCallback?.(dataSource, sql);
      }
    }
  }
}
