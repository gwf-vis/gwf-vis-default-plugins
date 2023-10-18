import type {
  GWFVisPlugin,
  GWFVisPluginWithData,
  GWFVisPluginWithSharedStates,
} from "vga-vis-host";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { css, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { LocationSelection, runAsyncWithLoading } from "../utils/basic";
import { GWFVisDBQueryObject, Location } from "../utils/data";

export default class GWFVisPluginTestDataFetcher
  extends LitElement
  implements
    GWFVisPlugin,
    GWFVisPluginWithSharedStates,
    GWFVisPluginWithData<GWFVisDBQueryObject, any>
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

  updateSharedStatesDelegate?:
    | ((sharedStates: GWFVisDefaultPluginSharedStates) => void)
    | undefined;
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
    this.locationSelection =
      this.#sharedStates?.["gwf-default.locationSelection"];
    if (!this.locationSelection) {
      return;
    }
    this.obtainMetadata(
      this.locationSelection?.dataSource,
      this.locationSelection?.locationId
    );
  }

  @state() locationSelection?: LocationSelection =
    this.#sharedStates?.["gwf-default.locationSelection"];
  @state() metadata?: Record<string, any>;

  obtainHeaderCallback = () => "Metadata";

  render() {
    return html`
      <div part="content">
        <span
          >Data Source:
          <b>${this.locationSelection?.dataSource ?? "N/A"}</b></span
        >
        <br />
        <span
          >Location ID:
          <b>${this.locationSelection?.locationId ?? "N/A"}</b></span
        >
        <div style="height: 1em;"></div>
        ${this.metadata
          ? map(
              Object.entries(this.metadata),
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
            )
          : html`<div>No metadata available.</div>`}
      </div>
    `;
  }

  private async obtainMetadata(dataSource?: string, locationId?: number) {
    if (!dataSource || locationId == null) {
      this.metadata = undefined;
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
