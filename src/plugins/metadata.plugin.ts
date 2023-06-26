import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { css, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { runAsyncWithLoading } from "../utils/basic";
import { GWFVisDBQueryObject, Location } from "../utils/data";

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements GWFVisPlugin, GWFVisPluginWithData<GWFVisDBQueryObject, any>
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
    | ((dataSource: string, queryObject: GWFVisDBQueryObject) => Promise<any>)
    | undefined;

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    const locationSelection =
      this.#sharedStates?.["gwf-default.locationSelection"];
    if (!locationSelection) {
      return;
    }
    this.obtainMetadata(
      locationSelection?.dataSource,
      locationSelection?.locationId
    );
  }

  @state() metadata?: Record<string, any>;

  obtainHeaderCallback = () => "Metadata";

  render() {
    const locationSelection =
      this.#sharedStates?.["gwf-default.locationSelection"];
    return html`
      <div part="content">
        <span
          >Data Source: <b>${locationSelection?.dataSource ?? "N/A"}</b></span
        >
        <br />
        <span
          >Location ID: <b>${locationSelection?.locationId ?? "N/A"}</b></span
        >
        <div style="height: 1em;"></div>
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

  private async obtainMetadata(dataSource?: string, locationId?: number) {
    if (!dataSource || locationId == null) {
      this.metadata = {};
      return;
    }
    runAsyncWithLoading(async () => {
      this.metadata = (
        (await this.queryDataDelegate?.(dataSource, {
          for: "locations",
          filter: { ids: [locationId] },
        })) as Location[]
      )?.at(0)?.metadata as Record<string, any>;
    }, this);
  }
}
