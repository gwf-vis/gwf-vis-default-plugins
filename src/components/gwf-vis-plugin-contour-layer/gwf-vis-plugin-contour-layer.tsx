import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';
import * as d3 from 'd3';
import { tricontour } from 'd3-tricontour';
import { ColorSchemeDefinition, obtainVariableColorScheme } from '../../utils/variable-color-scheme';

@Component({
  tag: 'gwf-vis-plugin-contour-layer',
  styleUrl: 'gwf-vis-plugin-contour-layer.css',
  shadow: true,
})
export class GwfVisPluginContourLayer implements ComponentInterface, GwfVisPluginMapLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-geojson-layer';

  private contourLayerInstance: L.GeoJSON;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() delegateOfRemovingFromMap: (layer: L.Layer) => void;
  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() layerName: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() options?: L.GeoJSONOptions;
  @Prop() dataSource: string;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() colorScheme?: { [variableName: string]: ColorSchemeDefinition };
  @Prop() thresholds?: number | number[] = 5;

  async connectedCallback() {
    this.delegateOfRemovingFromMap?.(this.contourLayerInstance);
    await this.generateVis();
    this.delegateOfAddingToMap(this.contourLayerInstance, this.layerName, this.type, this.active);
  }

  async disconnectedCallback() {
    this.delegateOfRemovingFromMap?.(this.contourLayerInstance);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, _propName: string) {
    this.connectedCallback();
  }

  @Method()
  async obtainHeader() {
    return 'Contour Map Layer';
  }

  render() {
    return <Host></Host>;
  }

  private async generateVis() {
    const locations = await this.delegateOfFetchingData?.({
      type: 'locations',
      from: this.dataSource,
      for: ['id', 'geometry'],
    });

    const variableName = this.variableName || this.globalInfo?.variableName;
    const dimensions = this.dimensions || this.globalInfo?.dimensionDict;
    let values, maxValue, minValue;
    if (variableName && dimensions) {
      values = await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.dataSource,
        with: {
          variable: variableName,
          dimensions,
        },
        for: ['location', 'value'],
      });
      [{ 'min(value)': minValue, 'max(value)': maxValue }] = (await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.dataSource,
        with: {
          variable: variableName,
        },
        for: ['min(value)', 'max(value)'],
      })) || [{ 'min(value)': undefined, 'max(value)': undefined }];
    }
    const colorScheme = obtainVariableColorScheme(this.colorScheme, variableName);
    const interpolateFunction = d3.piecewise(d3.interpolate, colorScheme);
    console.log(minValue, maxValue);
    // const scaleColor = d3.scaleSequential(interpolateFunction).domain([minValue, maxValue]);

    const data = locations
      .map(
        ({
          id,
          geometry: {
            type,
            coordinates: [lon, lat],
          },
        }) => (type === 'Point' ? { x: lon, y: lat, value: values?.find(({ location }) => location === id)?.value } : undefined),
      )
      ?.filter(({ value }) => typeof value !== 'undefined' && value !== null);

    const thresholds = Array.isArray(this.thresholds) ? this.thresholds : this.obtainQuantile(minValue, maxValue, this.thresholds ?? 5);
    const scaleColor = d3.scaleSequentialQuantile(interpolateFunction).domain(thresholds.sort());
    const contours = tricontour()
      .x(d => d.x)
      .y(d => d.y)
      .value(d => d.value)
      .thresholds(thresholds)(data);

    const defaultStyle = {
      weight: 0,
    };

    const geojson = {
      type: 'FeatureCollection',
      features: contours.map(g => ({ type: 'Feature', geometry: g })),
    } as any;

    this.contourLayerInstance = this.leaflet.geoJSON(geojson, {
      style: ({ geometry }) => ({
        ...defaultStyle,
        color: scaleColor(geometry['value']) as any,
        opacity: 0.5,
      }),
      ...this.options,
    });
  }

  private obtainQuantile(min: number, max: number, count: number) {
    // check if parameters are valid numbers
    if (isNaN(min) || isNaN(max) || isNaN(count)) {
      throw Error('Invalid input');
    }
    // check if count is positive integer
    if (count < 1 || !Number.isInteger(count)) {
      throw Error('Count must be positive integer');
    }
    // create an empty array to store quantiles
    let result = [];
    // calculate the interval size between quantiles
    let interval = (max - min) / count;
    // loop through count times and push quantiles to result array
    for (let i = 1; i < count; i++) {
      result.push(min + i * interval);
    }
    // return result array
    return result;
  }
}
