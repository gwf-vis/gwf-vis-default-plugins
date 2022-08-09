import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import { Chart, PointElement, registerables } from 'chart.js';
import { GwfVisPluginControl, GloablInfoDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-line-chart',
  styleUrl: 'gwf-vis-plugin-line-chart.css',
  shadow: true,
})
export class GwfVisPluginLineChart implements ComponentInterface, GwfVisPluginControl {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-line-chart';
  static readonly __PLUGIN_TYPE__ = 'control';

  private readonly defaultColors = ['#8CC63E', '#2989E3', '#724498', '#F02C89', '#FB943B', '#F4CD26'];
  private readonly fallbackValue = Number.NaN;

  private chart: Chart;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() datasetId: string;
  @Prop() variableNames?: string[];
  @Prop() dimension: string;

  constructor() {
    Chart.register(...registerables);
  }

  @Method()
  async obtainHeader() {
    return 'Line Chart';
  }

  render() {
    return (
      <Host>
        <canvas height="100%" width="100%" ref={el => this.drawChart(el)}></canvas>
      </Host>
    );
  }

  async drawChart(canvasElement: HTMLCanvasElement) {
    const dimensionQeury = { ...this.globalInfoDict?.dimensionDict };
    delete dimensionQeury[this.dimension];
    const variableNames = this.variableNames || [this.globalInfoDict?.variableName];
    const datasetId = this.globalInfoDict?.userSelectionDict?.dataset;
    const values = await this.fetchingDataDelegate({
      type: 'values',
      from: datasetId,
      with: {
        location: this.globalInfoDict?.userSelectionDict?.location,
        variable: variableNames,
        dimensions: dimensionQeury,
      },
      for: ['variable', 'value', `dimension_${this.dimension}`],
    });
    const dimensions = await this.fetchingDataDelegate({
      type: 'dimensions',
      from: datasetId,
    });
    const dimensionSize = dimensions?.find(dimension => dimension.name === this.dimension)?.size;
    const labels = [...new Array(dimensionSize || 0).keys()];
    const data = {
      labels,
      datasets: variableNames?.map((variableName, i) => ({
        label: variableName,
        backgroundColor: this.defaultColors?.[i] || 'hsl(0, 0%, 0%)',
        borderColor: this.defaultColors?.[i] || 'hsl(0, 0%, 0%)',
        data: this.obtainChartData(values, variableName, dimensionSize),
      })),
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        pointRadius: 0,
        onClick: (_event, items) => {
          items.forEach(item => {
            if (item.element instanceof PointElement) {
              const index = item.index;
              if (confirm(`Do you want to set dimension "${this.dimension}" to value "${index}"?`)) {
                const updatedGlobalInfo = { ...this.globalInfoDict };
                updatedGlobalInfo.dimensionDict = { ...updatedGlobalInfo.dimensionDict };
                updatedGlobalInfo.dimensionDict[this.dimension] = index;
                this.updatingGlobalInfoDelegate(updatedGlobalInfo);
              }
            }
          });
        },
      },
    };
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(canvasElement, config as any);
  }

  private obtainChartData(values: any[], variableName: string, dimensionSize: number) {
    const valuesForTheVariable = values?.filter(d => d.variable === variableName);
    for (let i = 0; i < dimensionSize; i++) {
      if (!valuesForTheVariable?.find(d => d[this.dimension] === i)) {
        const itemToBeInserted = { value: this.fallbackValue };
        itemToBeInserted[this.dimension] = i;
        valuesForTheVariable?.splice(i, 0, itemToBeInserted);
      }
    }
    return valuesForTheVariable?.sort((a, b) => a[`dimension_${this.dimension}`] - b[`dimension_${this.dimension}`]).map(d => d.value);
  }
}
