import { GwfVisPlugin, GwfVisPluginWithData } from "gwf-vis-host";
import { css, html, LitElement } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { QueryExecResult } from "sql.js";

export default class GwfVisPluginGwfvisdbLocalDataProvider
  extends LitElement
  implements
    GwfVisPlugin,
    GwfVisPluginWithData<string, initSqlJs.QueryExecResult | undefined>
{
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }
  `;

  #dataSourceInputRef = createRef<HTMLInputElement>();
  #sqlTextareaRef = createRef<HTMLTextAreaElement>();
  #resultContainer = createRef<HTMLDivElement>();

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
        ></div>
      </gwf-vis-ui-collapse>
    `;
  }

  private async queryData() {
    if (this.checkIfDataProviderRegisteredCallback?.("sqlite-local")) {
      const dataSource = this.#dataSourceInputRef.value?.value;
      const sql = this.#sqlTextareaRef.value?.value;
      if (dataSource && sql) {
        const result = await this.queryDataCallback?.(dataSource, sql);
        this.#resultContainer.value?.replaceChildren(
          document.createTextNode(JSON.stringify(result))
        );
      }
    }
  }
}
