import type { GWFVisPlugin, GWFVisPluginWithData } from "gwf-vis-host";
import type { QueryExecResult } from "sql.js";
import type { GWFVisDefaultPluginSharedStates } from "../utils/state";

import { css, html, LitElement } from "lit";
import Chart from "chart.js/auto";

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

  #chart?: Chart<"line", any, number>;

  #sharedStates?: GWFVisDefaultPluginSharedStates;
  get sharedStates() {
    return this.#sharedStates;
  }
  set sharedStates(value: GWFVisDefaultPluginSharedStates | undefined) {
    this.#sharedStates = value;
    const metadata = this.#sharedStates?.["gwf-default.metadata"];
    const canvas = this.shadowRoot?.querySelector("#main-canvas");
    if (canvas) {
      this.#chart?.destroy();
      this.#chart = new Chart(canvas as HTMLCanvasElement, {
        type: "line",
        data: {
          labels: [1, 2, 3],
          datasets: [
            {
              label: "Data",
              data: metadata?.Mesh2_face_nodes.split(",").map(
                (d: string) => +d
              ),
              fill: false,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          elements: {
            point: {
              radius: 0,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }

  obtainHeaderCallback = () => "Metadata";

  render() {
    return html`
      <div part="content">
        <canvas id="main-canvas"></canvas>
      </div>
    `;
  }
}
