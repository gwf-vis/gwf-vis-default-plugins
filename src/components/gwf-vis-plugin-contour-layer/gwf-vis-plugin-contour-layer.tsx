import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';
import * as d3 from 'd3';
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
    let queryResult = await this.delegateOfFetchingData?.({
      type: 'info',
      from: this.dataSource,
      for: ['key', 'value'],
      with: { key: '"location_matrix"' },
    });
    const locationMatirxInfo = JSON.parse(queryResult?.[0]?.value ?? null) as {
      minLatitude: number;
      maxLatitude: number;
      minLongitude: number;
      maxLongitude: number;
      idMatrix: number[][];
    } | null;

    if (locationMatirxInfo) {
      let valueQueryResult; //, maxValue, minValue;
      const variableName = this.variableName || this.globalInfo?.variableName;
      const dimensions = this.dimensions || this.globalInfo?.dimensionDict;
      valueQueryResult = await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.dataSource,
        with: {
          variable: variableName,
          dimensions,
        },
        for: ['location', 'value'],
      });

      if (valueQueryResult?.length > 0) {
        const colorScheme = obtainVariableColorScheme(this.colorScheme, variableName);
        const interpolateFunction = d3.piecewise(d3.interpolate, colorScheme);
        // const scaleColor = d3.scaleSequential(interpolateFunction).domain([minValue, maxValue]);

        const values = locationMatirxInfo?.idMatrix?.flatMap(row =>
          row.map(locationId => (valueQueryResult?.find(({ location }) => location === locationId)?.value ?? Number.NaN) as number),
        );
        const yCount = locationMatirxInfo?.idMatrix?.length;
        const xCount = locationMatirxInfo?.idMatrix?.[0].length;
        const contours = d3.contours().size([xCount, yCount]).thresholds(this.thresholds)(values);
        const scaleX = d3.scaleLinear().domain([0, xCount]).range([locationMatirxInfo.minLongitude, locationMatirxInfo.maxLongitude]);
        const scaleY = d3.scaleLinear().domain([0, yCount]).range([locationMatirxInfo.minLatitude, locationMatirxInfo.maxLatitude]);

        function ndArrayChangeValue(arr: any[], fn: (value: any) => any, fn2: (value: any) => any) {
          return arr.map((item, i) => (Array.isArray(item) ? ndArrayChangeValue(item, fn, fn2) : i === 0 ? fn(item) : fn2(item)));
        }

        contours.forEach(d => (d.coordinates = ndArrayChangeValue(d.coordinates, scaleX, scaleY)));
        const defaultStyle = {
          fillOpacity: 0.5,
          weight: 0,
        };

        const thresholds = contours.map(contour => contour.value);
        const scaleColor = d3.scaleSequentialQuantile(interpolateFunction).domain(thresholds.sort());

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
    }
  }
}
