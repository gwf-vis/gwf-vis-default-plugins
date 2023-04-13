import type { GWFVisDataProviderPlugin, GWFVisPlugin } from "gwf-vis-host";
import { html, css, LitElement } from "lit";
import initSqlJs, { Database } from "sql.js";
import sqlJsWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { runAsyncWithLoading } from "../utils/basic";

export default class GWFVisPluginSqliteLocalDataProvider
  extends LitElement
  implements
    GWFVisPlugin,
    GWFVisDataProviderPlugin<string, initSqlJs.QueryExecResult | undefined>
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

  notifyLoadingDelegate?: () => () => void;

  #SQL?: initSqlJs.SqlJsStatic;
  #dbInstanceMap = new Map<string, Database>();

  obtainHeaderCallback = () => `sqlite-local Data Provider`;

  obtainDataProviderIdentifiersCallback = () => ["sqlite-local"];

  async queryDataCallback(
    _identifier: string,
    dataSource: string,
    queryObject: string
  ) {
    if (dataSource && queryObject) {
      const result = await runAsyncWithLoading(async () => {
        const db = await this.obtainDbInstance(dataSource);
        return db?.exec(queryObject)?.[0];
      }, this);
      return result;
    }
    return undefined;
  }

  render() {
    return html`<i>sqlite-local</i> Data Provider`;
  }

  private async obtainDbInstance(dataSource: string) {
    let db = this.#dbInstanceMap.get(dataSource);
    if (db) {
      return db;
    }
    if (!this.#SQL) {
      this.#SQL = await this.loadSQL();
      if (!this.#SQL) {
        throw Error("Fail to load sql.js.");
      }
    }
    const dbUrl = dataSource;
    const dbBuffer = await fetch(dbUrl).then((response) =>
      response.arrayBuffer()
    );
    db = new this.#SQL.Database(new Uint8Array(dbBuffer));
    this.#dbInstanceMap.set(dataSource, db);
    return db;
  }

  private async loadSQL() {
    return await runAsyncWithLoading(
      async () =>
        await initSqlJs({
          locateFile: () => sqlJsWasmUrl,
        }),
      this
    );
  }
}
