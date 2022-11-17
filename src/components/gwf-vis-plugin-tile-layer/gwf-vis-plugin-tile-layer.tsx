import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { Map } from 'leaflet';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-tile-layer',
  styleUrl: 'gwf-vis-plugin-tile-layer.css',
  shadow: true,
})
export class GwfVisPluginTileLayer implements ComponentInterface, GwfVisPluginMapLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-tile-layer';

  private tileLayerInstance: L.TileLayer;
  private clickHandler = async (event: L.LeafletMouseEvent) => {
    const { lat, lng } = event.latlng;
    const variableName = this.variableName || this.globalInfo?.variableName;
    const dimensions = this.dimensions || this.globalInfo?.dimensionDict;
    if (variableName && dimensions) {
      const locations = await this.delegateOfFetchingData?.({
        type: 'locations',
        from: this.dataSource,
        for: ['id', 'geometry'],
      });
      const location = locations.find(l => {
        return l.geometry?.coordinates?.find(polygon => {
          return this.isPointInsidePolygon([lng, lat], polygon)
        })
      });
      if(location) {
        this.delegateOfUpdatingGlobalInfo?.({
          ...this.globalInfo,
          userSelection: { dataset: this.dataSource, location: location.id },
        });
      }
    }
  };

  @Prop() leaflet: typeof globalThis.L;
  @Prop() mapInstance?: Map;
  @Prop() delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() delegateOfRemovingFromMap: (layer: L.Layer) => void;
  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() layerName: string;
  @Prop() type: 'base-layer' | 'overlay' = 'base-layer';
  @Prop() active: boolean = true;
  @Prop() urlTemplate: string;
  @Prop() clickable: boolean = false;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() options?: L.TileLayerOptions;
  @Prop() dataSource: string;

  async connectedCallback() {
    this.delegateOfRemovingFromMap?.(this.tileLayerInstance);
    if (this.urlTemplate) {
      this.tileLayerInstance = this.leaflet.tileLayer(this.urlTemplate, this.options);
      this.delegateOfAddingToMap(this.tileLayerInstance, this.layerName, this.type, this.active);
      if (this.clickable) {
        this.mapInstance?.addEventListener('click', this.clickHandler);
      }
    }
  }

  async disconnectedCallback() {
    this.delegateOfRemovingFromMap?.(this.tileLayerInstance);
    this.mapInstance?.removeEventListener('click', this.clickHandler);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (propName === 'globalInfoDict') {
      return false;
    }
  }

  @Method()
  async obtainHeader() {
    return 'GeoJSON Map Layer';
  }

  render() {
    return <Host></Host>;
  }

  isPointInsidePolygon(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    var x = point[0],
      y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0],
        yi = vs[i][1];
      var xj = vs[j][0],
        yj = vs[j][1];

      var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
}
