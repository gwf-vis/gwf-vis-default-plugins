import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { GwfVisPlugin, GloablInfoDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-radar-chart',
  styleUrl: 'gwf-vis-plugin-radar-chart.css',
  shadow: true,
})
export class GwfVisPluginRadarChart implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-radar-chart';

  private chart: Chart;

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
    const datasetId = this.datasetId || this.globalInfoDict?.userSelectionDict?.dataset;
    const locations = (this.globalInfoDict?.pinnedSelections || []).filter(location => location.dataset === datasetId);
    if (
      this.globalInfoDict?.userSelectionDict &&
      !locations.find(location => location.dataset === this.globalInfoDict.userSelectionDict.dataset && location.location === this.globalInfoDict.userSelectionDict.location)
    ) {
      locations.push({ ...this.globalInfoDict.userSelectionDict, color: 'hsl(0, 0%, 70%)' });
    }
    const variableNames =
      this.variableNames ||
      (
        await this.fetchingDataDelegate({
          type: 'variables',
          from: datasetId,
        })
      )?.map(variable => variable.name);
    const dimensionDict = this.dimensions || this.globalInfoDict?.dimensionDict;
    const locationIds = locations.map(d => d.location);
    const values = await this.fetchingDataDelegate({
      type: 'values',
      from: datasetId,
      with: {
        location: locationIds,
        variable: variableNames,
        dimensions: dimensionDict,
      },
      for: ['location', 'variable', 'value'],
    });

    const data = {
      labels: variableNames,
      datasets: locations.map(location => {
        const color = location.color || 'hsl(0, 0%, 0%)';
        const colorRgb = d3.rgb(color);
        colorRgb.opacity *= 0.5;
        const colorWithHalfOpacity = colorRgb.toString();
        return {
          label: `Location ${location.location ?? 'N/A'}`,
          data: variableNames?.map(variableName => values?.find(d => d.variable === variableName && d.location === location.location)?.value),
          backgroundColor: colorWithHalfOpacity,
          borderColor: color,
        };
      }),
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
