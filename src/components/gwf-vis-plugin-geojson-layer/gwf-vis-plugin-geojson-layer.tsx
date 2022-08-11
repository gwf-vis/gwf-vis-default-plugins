import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';
import * as d3 from 'd3';
import { ColorSchemeDefinition, obtainVariableColorScheme } from '../../utils/variable-color-scheme';

@Component({
  tag: 'gwf-vis-plugin-geojson-layer',
  styleUrl: 'gwf-vis-plugin-geojson-layer.css',
  shadow: true,
})
export class GwfVisPluginGeojsonLayer implements ComponentInterface, GwfVisPluginMapLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-geojson-layer';

  private geojsonLayerInstance: L.GeoJSON;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() delegateOfRemovingFromMap: (layer: L.Layer) => void;
  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() options?: L.GeoJSONOptions;
  @Prop() datasetId: string;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() colorScheme?: { [variableName: string]: ColorSchemeDefinition };

  async connectedCallback() {
    this.delegateOfRemovingFromMap?.(this.geojsonLayerInstance);
    await this.drawShape();
    await this.applyData();
    await this.applyHighlighs();
    this.delegateOfAddingToMap(this.geojsonLayerInstance, this.name, this.type, this.active);
  }

  async disconnectedCallback() {
    this.delegateOfRemovingFromMap?.(this.geojsonLayerInstance);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (!this.geojsonLayerInstance) {
      this.connectedCallback();
      return;
    }
    if (propName === 'datasetId') {
      this.drawShape().then(() => this.applyData().then(() => this.applyHighlighs()));
    } else if (propName === 'globalInfo') {
      if (_newValue?.variableName !== _oldValue?.variableName || _newValue?.dimensionDict !== _oldValue?.dimensionDict) {
        this.applyData();
      }
      if (_newValue?.userSelection !== _oldValue?.userSelection || _newValue?.pinnedSelections !== _oldValue?.pinnedSelections) {
        this.applyHighlighs();
      }
    } else {
      this.applyData();
    }
  }

  @Method()
  async obtainHeader() {
    return 'GeoJSON Map Layer';
  }

  render() {
    return <Host></Host>;
  }

  private async applyData() {
    const variableName = this.variableName || this.globalInfo?.variableName;
    const dimensions = this.dimensions || this.globalInfo?.dimensionDict;
    let values, maxValue, minValue;
    if (variableName && dimensions) {
      values = await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variable: variableName,
          dimensions,
        },
        for: ['location', 'value'],
      });
      [{ 'min(value)': minValue, 'max(value)': maxValue }] = (await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variable: variableName,
        },
        for: ['min(value)', 'max(value)'],
      })) || [{ 'min(value)': undefined, 'max(value)': undefined }];
    }
    const colorScheme = obtainVariableColorScheme(this.colorScheme, variableName);
    const interpolateFunction = d3.piecewise(d3.interpolate, colorScheme);
    const scaleColor = d3.scaleSequential(interpolateFunction).domain([minValue, maxValue]);
    this.geojsonLayerInstance?.bindTooltip(({ feature }: any) => {
      const locationId = feature?.properties?.id;
      const value = values?.find(({ location }) => location === locationId)?.value;
      return `Location ID: ${locationId}<br/>Value: ${value ?? 'N/A'}`;
    });
    this.geojsonLayerInstance?.setStyle(feature => {
      const { properties } = feature;
      const value = values?.find(({ location }) => location === properties?.id)?.value;
      const fillColor = (scaleColor(value) as any) || 'transparent';
      const style = {
        fillColor,
        fillOpacity: 0.5,
      };
      return style;
    });
  }

  private async applyHighlighs() {
    this.geojsonLayerInstance.setStyle(feature => {
      const { properties } = feature;
      const style = {
        color: 'hsl(0, 0%, 70%)',
        weight: 1,
      };
      const matchedPin = this.globalInfo?.pinnedSelections?.find(pin => pin.dataset === this.datasetId && pin.location === properties?.id);
      if (matchedPin) {
        style['color'] = matchedPin.color;
        style['weight'] = 3;
      }
      if (this.globalInfo?.userSelection?.dataset === this.datasetId && this.globalInfo?.userSelection?.location === properties?.id) {
        style['weight'] = 5;
        this.geojsonLayerInstance
          .getLayers()
          ?.find(layer => layer['feature'] === feature)
          ?.['bringToFront']();
      }
      return style;
    });
  }

  private async drawShape() {
    const locations = await this.delegateOfFetchingData?.({
      type: 'locations',
      from: this.datasetId,
      for: ['id', 'geometry'],
    });
    const geojson = {
      type: 'FeatureCollection',
      features:
        locations?.map((location: any) => ({
          type: 'Feature',
          properties: {
            id: location.id,
          },
          geometry: location.geometry,
        })) || [],
    } as any;
    const locationIds: string[] = [];
    this.geojsonLayerInstance = this.leaflet.geoJSON(geojson, {
      ...this.options,
      onEachFeature: ({ properties }, layer) => {
        locationIds.push(properties.id.toString());
        layer.on('click', () =>
          this.delegateOfUpdatingGlobalInfo?.({
            ...this.globalInfo,
            userSelection: { dataset: this.datasetId, location: properties.id },
          }),
        );
      },
      pointToLayer: (_feature, latlng) => new globalThis.L.CircleMarker(latlng, { radius: 10 }),
    });
  }
}
