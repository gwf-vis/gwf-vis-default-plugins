import type { GWFVisDataProviderPlugin, GWFVisPlugin } from "gwf-vis-host";
import { html, css, LitElement } from "lit";
import initSqlJs, { Database } from "sql.js";
import sqlJsWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { runAsyncWithLoading } from "../utils/basic";
import { createRef, ref } from "lit/directives/ref.js";

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
  #dialogRef = createRef<HTMLDialogElement>();
  #directoryHandle?: FileSystemDirectoryHandle;

  obtainHeaderCallback = () => `sqlite-local Data Provider`;

  obtainDataProviderIdentifiersCallback = () => ["sqlite-local"];

  firstUpdated() {
    if (!this.#directoryHandle) {
      this.#dialogRef.value?.showModal();
    }
  }

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
    return html`
      <i>sqlite-local</i> Data Provider
      <dialog ${ref(this.#dialogRef)}>
        You are using the sqlite local file data provider, Please select a root
        directory by click the button below.
        <hr />
        <gwf-vis-ui-button
          @click=${async () => {
            this.#directoryHandle = (await (
              window as any
            ).showDirectoryPicker()) as FileSystemDirectoryHandle;
            this.#dialogRef.value?.close();
          }}
          >Select Root Directory</gwf-vis-ui-button
        >
      </dialog>
    `;
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
    let dbBuffer: ArrayBuffer | undefined;
    if (dbUrl.startsWith("file:")) {
      if (!this.#directoryHandle) {
        alert("No root directory has been selected.");
        return;
      }
      const subpaths = dbUrl.replace(/^file:/, "").split("/");
      let walker = this.#directoryHandle;
      for (const subpath of subpaths.slice(0, -1)) {
        walker = await walker.getDirectoryHandle(subpath);
      }
      const fileHandle = await walker.getFileHandle(subpaths.at(-1) ?? "");
      const file = await fileHandle.getFile();
      dbBuffer = await file.arrayBuffer();
    } else {
      dbBuffer = await fetch(dbUrl).then((response) => response.arrayBuffer());
    }
    if (!dbBuffer) {
      return;
    }
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
