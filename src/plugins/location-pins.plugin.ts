import type { GWFVisPlugin, GWFVisPluginWithSharedStates } from "vga-vis-host";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { css, html, LitElement } from "lit";
import { map } from "lit/directives/map.js";
import { property } from "lit/decorators.js";
import { GWFVisDBQueryObject } from "../utils/data";

const DEFAULT_COLORS = [
  "#8CC63E",
  "#2989E3",
  "#724498",
  "#F02C89",
  "#FB943B",
  "#F4CD26",
];

export default class GWFVisPluginLocationPins
  extends LitElement
  implements GWFVisPlugin, GWFVisPluginWithSharedStates
{
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }

    [part="pin-section"] {
      margin-top: 0.5rem;
    }

    [part="pin-section"] > [part="pin-container"] {
      max-width: 100%;
      overflow-x: auto;
      height: auto;
      white-space: nowrap;
    }

    [part="pin-section"] > [part="button-container"] {
      display: flex;
      gap: 0.25rem;
    }

    [part="pin-section"] > [part="button-container"] > button {
      flex: 1;
    }

    button {
      outline: none;
      border: none;
      border-radius: 5px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      transition: box-shadow 0.3s;
    }

    button:hover {
      box-shadow: 0 1px 5px 0 hsl(0 0% 0% / 0.5);
    }

    .pin {
      display: inline-block;
      height: 1rem;
      width: 1rem;
      margin: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 1px 2px 0 hsl(0 0% 0% / 0.5);
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

  @property() sharedStates?: GWFVisDefaultPluginSharedStates;

  obtainHeaderCallback = () => "Location Pins";

  render() {
    const locationSelection =
      this.sharedStates?.["gwf-default.locationSelection"];
    return html`
      <div part="content">
        <div part="info-section">
          <div>
            <b>Data Source</b>: ${locationSelection?.dataSource || "N/A"}
          </div>
          <div>
            <b>Location ID</b>: ${locationSelection?.locationId || "N/A"}
          </div>
        </div>
        <div part="pin-section">
          <div part="button-container">
            <gwf-vis-ui-button
              variant="solid"
              @click=${() => {
                if (
                  locationSelection?.dataSource &&
                  locationSelection.locationId
                ) {
                  let locationPins =
                    this.sharedStates?.["gwf-default.locationPins"];
                  if (!locationPins) {
                    locationPins = [];
                  }
                  this.updateSharedStatesDelegate?.({
                    ...this.sharedStates,
                    "gwf-default.locationPins": [
                      ...locationPins,
                      {
                        dataSource: locationSelection.dataSource,
                        locationId: locationSelection.locationId,
                        color:
                          DEFAULT_COLORS.find(
                            (color) =>
                              !locationPins
                                ?.map((pin) => pin.color)
                                .includes(color)
                          ) || "hsl(0, 0%, 30%)",
                      },
                    ],
                  });
                }
              }}
            >
              Pin Current
            </gwf-vis-ui-button>
            <gwf-vis-ui-button
              class="hollow"
              @click=${() => {
                if (
                  locationSelection?.dataSource &&
                  locationSelection.locationId
                ) {
                  let locationPins =
                    this.sharedStates?.["gwf-default.locationPins"];
                  if (!locationPins) {
                    locationPins = [];
                  }
                  const filteredLocationPins = locationPins.filter(
                    (pin) =>
                      pin.dataSource !== locationSelection.dataSource ||
                      pin.locationId !== locationSelection.locationId
                  );
                  this.updateSharedStatesDelegate?.({
                    ...this.sharedStates,
                    "gwf-default.locationPins": filteredLocationPins,
                  });
                }
              }}
            >
              Remove Current
            </gwf-vis-ui-button>
          </div>
          <div part="pin-container">
            ${(this.sharedStates?.["gwf-default.locationPins"]?.length ?? 0) > 0
              ? map(
                  this.sharedStates?.["gwf-default.locationPins"],
                  (locationPin) => html` <button
                    class="pin"
                    style="background: ${locationPin.color}"
                    title=${`Dataset: ${locationPin.dataSource}\nLocation: ${locationPin.locationId}`}
                    @click=${() => {
                      const locationSelection = {
                        dataSource: locationPin.dataSource,
                        locationId: locationPin.locationId,
                      };
                      this.updateSharedStatesDelegate?.({
                        ...this.sharedStates,
                        "gwf-default.locationSelection": locationSelection,
                      });
                    }}
                  ></button>`
                )
              : "No pinned location yet"}
          </div>
        </div>
      </div>
    `;
  }
}
