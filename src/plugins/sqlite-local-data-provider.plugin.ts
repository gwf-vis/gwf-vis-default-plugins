import type { GWFVisDataProviderPlugin, GWFVisPlugin } from "gwf-vis-host";
import { html, css, LitElement } from "lit";
import initSqlJs, { Database } from "sql.js";
import sqlJsWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

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
      const loadingEndDelegate = this.notifyLoadingDelegate?.();
      const db = await this.obtainDbInstance(dataSource);
      const result = db?.exec(queryObject)?.[0];
      loadingEndDelegate?.();
      return result;
    }
    return undefined;
  }

  async hostFirstLoadedCallback() {
    const loadingEndDelegate = this.notifyLoadingDelegate?.();
    this.#SQL = await initSqlJs({
      locateFile: () => sqlJsWasmUrl,
    });
    loadingEndDelegate?.();
  }

  render() {
    return html`<i>sqlite-local</i> Data Provider`;
  }

  private async obtainDbInstance(dataSource: string) {
    let db = this.#dbInstanceMap.get(dataSource);
    if (db) {
      return db;
    }
    if (this.#SQL) {
      const dbUrl = dataSource;
      const dbBuffer = await fetch(dbUrl).then((response) =>
        response.arrayBuffer()
      );
      db = new this.#SQL.Database(new Uint8Array(dbBuffer));
      this.#dbInstanceMap.set(dataSource, db);
      return db;
    }
    return undefined;
  }
}
