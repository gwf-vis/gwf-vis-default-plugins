import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import Chart from 'chart.js/auto';
import { PointElement } from 'chart.js';
import { GwfVisPlugin, GloablInfo } from '../../utils/gwf-vis-plugin';
import { VERTICLE_LINE_CHART_PLUGIN } from './varticle-line-chart-plugin';

@Component({
  tag: 'gwf-vis-plugin-line-chart',
  styleUrl: 'gwf-vis-plugin-line-chart.css',
  shadow: true,
})
export class GwfVisPluginLineChart implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-line-chart';

  private readonly DEFAULT_COLORS = ['#8CC63E', '#2989E3', '#724498', '#F02C89', '#FB943B', '#F4CD26'];
  private readonly FALLBACK_VALUE = Number.NaN;

  private chart: Chart;

  @Prop() delegateOfFetchingData: (query: any) => Promise<any>;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() datasetId: string;
  @Prop() variableNames?: string[];
  @Prop() dimension: string;

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
    const dimensionQeury = { ...this.globalInfo?.dimensionDict };
    delete dimensionQeury[this.dimension];
    const variableNames = this.variableNames || [this.globalInfo?.variableName];
    const datasetId = this.datasetId || this.globalInfo?.userSelection?.dataset;
    const values = await this.delegateOfFetchingData({
      type: 'values',
      from: datasetId,
      with: {
        location: this.globalInfo?.userSelection?.location,
        variable: variableNames,
        dimensions: dimensionQeury,
      },
      for: ['variable', 'value', `dimension_${this.dimension}`],
    });
    const dimensions = await this.delegateOfFetchingData({
      type: 'dimensions',
      from: datasetId,
    });
    const dimensionSize = dimensions?.find(dimension => dimension.name === this.dimension)?.size;
    const labels = [...new Array(dimensionSize || 0).keys()];
    const data = {
      labels,
      datasets: variableNames?.map((variableName, i) => ({
        label: variableName,
        backgroundColor: this.DEFAULT_COLORS?.[i] || 'hsl(0, 0%, 0%)',
        borderColor: this.DEFAULT_COLORS?.[i] || 'hsl(0, 0%, 0%)',
        data: this.obtainChartData(values, variableName, dimensionSize),
      })),
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        pointRadius: 0,
        onClick: (_event, items) => {
          items.every(item => {
            if (item.element instanceof PointElement) {
              const index = item.index;
              if (confirm(`Do you want to set dimension "${this.dimension}" to value "${index}"?`)) {
                const updatedGlobalInfo = { ...this.globalInfo };
                updatedGlobalInfo.dimensionDict = { ...updatedGlobalInfo.dimensionDict };
                updatedGlobalInfo.dimensionDict[this.dimension] = index;
                this.delegateOfUpdatingGlobalInfo(updatedGlobalInfo);
              }
            }
            return false;
          });
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
      plugins: [VERTICLE_LINE_CHART_PLUGIN],
    };
    if (this.chart) {
      this.chart.data = data;
      this.chart.update();
    } else {
      this.chart = new Chart(canvasElement, config as any);
    }
  }

  private obtainChartData(values: any[], variableName: string, dimensionSize: number) {
    const valuesForTheVariable = values?.filter(d => d.variable === variableName);
    for (let i = 0; i < dimensionSize; i++) {
      if (!valuesForTheVariable?.find(d => d[this.dimension] === i)) {
        const itemToBeInserted = { value: this.FALLBACK_VALUE };
        itemToBeInserted[this.dimension] = i;
        valuesForTheVariable?.splice(i, 0, itemToBeInserted);
      }
    }
    return valuesForTheVariable?.sort((a, b) => a[`dimension_${this.dimension}`] - b[`dimension_${this.dimension}`]).map(d => d.value);
  }
}
