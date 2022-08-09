import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import Chart from 'chart.js/auto';
import { GwfVisPluginControl, GloablInfoDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-radar-chart',
  styleUrl: 'gwf-vis-plugin-radar-chart.css',
  shadow: true,
})
export class GwfVisPluginRadarChart implements ComponentInterface, GwfVisPluginControl {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-radar-chart';
  static readonly __PLUGIN_TYPE__ = 'control';

  private chart: Chart;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() datasetId: string;
  @Prop() variableNames?: string[];
  @Prop() dimensions?: { [dimension: string]: number };

  @Method()
  async obtainHeader() {
    return 'Radar Chart';
  }

  render() {
    return (
      <Host>
        <canvas height="100%" width="100%" ref={el => this.drawChart(el)}></canvas>
      </Host>
    );
  }

  async drawChart(canvasElement: HTMLCanvasElement) {
    const datasetId = this.globalInfoDict?.userSelectionDict?.dataset || this.datasetId;
    const variableNames =
      this.variableNames ||
      (
        await this.fetchingDataDelegate({
          type: 'variables',
          from: datasetId,
        })
      )?.map(variable => variable.name);
    const dimensionDict = this.dimensions || this.globalInfoDict?.dimensionDict;
    const locationId = this.globalInfoDict?.userSelectionDict?.location;
    const values = await this.fetchingDataDelegate({
      type: 'values',
      from: datasetId,
      with: {
        location: locationId,
        variable: variableNames,
        dimensions: dimensionDict,
      },
      for: ['variable', 'value'],
    });

    const data = {
      labels: variableNames,
      datasets: [
        {
          label: `Location ${locationId ?? 'N/A'}`,
          data: variableNames?.map(variableName => values?.find(d => d.variable === variableName)?.value),
        },
      ],
    };
    const config = {
      type: 'radar',
      data,
    };
    if (this.chart) {
      this.chart.data = data;
      this.chart.update();
    } else {
      this.chart = new Chart(canvasElement, config as any);
    }
  }
}
