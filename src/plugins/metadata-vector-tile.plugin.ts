import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { css, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { obtainLocationMetadata } from "../utils/data";
import { runAsyncWithLoading } from "../utils/basic";

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
  `;

  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((
        dataSource: string,
        queryObject: string
      ) => Promise<QueryExecResult | undefined>)
    | undefined;

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    this.metadata = this.#sharedStates?.["gwf-default.metadata"];
  }

  @state() metadata?: Record<string, any>;

  obtainHeaderCallback = () => "Metadata";

  render() {
    return html`
      <div part="content">
        ${map(
          Object.entries(this.metadata || {}),
          ([key, value]) => html`
            <div>
              <span>
                <b>${key.toString()}</b>
              </span>
              <div .innerHTML=${value?.toString()}></div>
              <hr
                style="height: 2px; border: none; outline: none; background: hsl(0, 0%, 70%);"
              />
            </div>
          `
        )}
      </div>
    `;
  }
}
