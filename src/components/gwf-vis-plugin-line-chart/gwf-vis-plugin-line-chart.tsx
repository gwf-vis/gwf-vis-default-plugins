import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import Chart from 'chart.js/auto';
import { PointElement } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
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
  @Prop() dataSource: string;
  @Prop() variableNames?: string[];
  @Prop() variableName?: string;
  @Prop() locationIds?: number[];
  @Prop() dimension: string;
  @Prop() height?: string;
  @Prop() width?: string;

  constructor() {
    Chart.register(zoomPlugin);
  }

  @Method()
  async obtainHeader() {
    return 'Line Chart';
  }

  render() {
    return (
      <Host style={{ height: this.height, width: this.width }}>
        <canvas height="100%" width="100%" ref={el => this.drawChart(el)}></canvas>
      </Host>
    );
  }

  async drawChart(canvasElement: HTMLCanvasElement) {
    const dimensionQeury = { ...this.globalInfo?.dimensionDict };
    delete dimensionQeury?.[this.dimension];
    const dataSource = this.dataSource || this.globalInfo?.userSelection?.dataset;
    let values = [];
    let dimensions = [];
    let datasets = [];
    let dimension;
    let dimensionSize;

    switch (!!this.variableName) {
      case false: {
        const variableNames = this.variableNames || (this.globalInfo?.variableName ? [this.globalInfo?.variableName] : []);
        const location = this.globalInfo?.userSelection?.location;
        if (dataSource && location && variableNames?.length > 0) {
          values = await this.delegateOfFetchingData({
            type: 'values',
            from: dataSource,
            with: {
              location,
              variable: variableNames,
              dimensions: dimensionQeury,
            },
            for: ['variable', 'value', `dimension_${this.dimension}`],
          });
          dimensions = await this.delegateOfFetchingData({
            type: 'dimensions',
            from: dataSource,
          });
        }
        dimension = dimensions?.find(dimension => dimension.name === this.dimension);
        dimensionSize = dimension?.size;
        datasets = variableNames?.map((variableName, i) => ({
          label: variableName,
          backgroundColor: this.DEFAULT_COLORS?.[i] || 'hsl(0, 0%, 0%)',
          borderColor: this.DEFAULT_COLORS?.[i] || 'hsl(0, 0%, 0%)',
          data: this.obtainChartDataForVariable(values, variableName, dimensionSize),
        }));
        break;
      }
      case true: {
        const locations = (this.globalInfo?.pinnedSelections || []).filter(location => location.dataset === dataSource);
        if (
          this.globalInfo?.userSelection &&
          !locations.find(location => location.dataset === this.globalInfo.userSelection.dataset && location.location === this.globalInfo.userSelection.location)
        ) {
          locations.push({ ...this.globalInfo.userSelection, color: 'hsl(0, 0%, 70%)' });
        }
        const locationIds = locations?.map(location => location.location);
        const variableName = this.variableName ?? this.globalInfo?.variableName;
        if (dataSource && locations?.length > 0 && variableName) {
          values = await this.delegateOfFetchingData({
            type: 'values',
            from: dataSource,
            with: {
              location: locationIds,
              variable: variableName,
              dimensions: dimensionQeury,
            },
            for: ['location', 'value', `dimension_${this.dimension}`],
          });
          dimensions = await this.delegateOfFetchingData({
            type: 'dimensions',
            from: dataSource,
          });
        }
        dimension = dimensions?.find(dimension => dimension.name === this.dimension);
        dimensionSize = dimension?.size;
        datasets = locations?.map((location) => ({
          label: `Location ${location.location ?? 'N/A'}`,
          backgroundColor: location.color || 'hsl(0, 0%, 0%)',
          borderColor: location.color || 'hsl(0, 0%, 0%)',
          data: this.obtainChartDataForLocation(values, location.location, dimensionSize),
        }));
        break;
      }
    }

    const labels = dimension?.value_labels ?? [...new Array(dimensionSize || 0).keys()];
    const data = {
      labels,
      datasets,
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
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl',
              },
              pinch: {
                enabled: true,
              },
              mode: 'xy',
              overScaleMode: 'xy',
            },
            pan: {
              enabled: true,
              mode: 'xy',
              overScaleMode: 'xy',
            },
          },
        },
      },
      plugins: [VERTICLE_LINE_CHART_PLUGIN],
    };
    if (this.chart) {
      this.chart.data = data;
      this.chart.resetZoom();
      this.chart.update();
    } else if (values?.length > 0) {
      this.chart = new Chart(canvasElement, config as any);
    }
  }

  private obtainChartDataForVariable(values: any[], variableName: string, dimensionSize: number) {
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

  private obtainChartDataForLocation(values: any[], locationId: string, dimensionSize: number) {
    const valuesForTheLocation = values?.filter(d => d.location.toString() === locationId.toString());
    for (let i = 0; i < dimensionSize; i++) {
      if (!valuesForTheLocation?.find(d => d[this.dimension] === i)) {
        const itemToBeInserted = { value: this.FALLBACK_VALUE };
        itemToBeInserted[this.dimension] = i;
        valuesForTheLocation?.splice(i, 0, itemToBeInserted);
      }
    }
    return valuesForTheLocation?.sort((a, b) => a[`dimension_${this.dimension}`] - b[`dimension_${this.dimension}`]).map(d => d.value);
  }
}
