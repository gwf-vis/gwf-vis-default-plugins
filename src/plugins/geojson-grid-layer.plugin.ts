import type { LayerType, leaflet } from "gwf-vis-host";
import "leaflet.vectorgrid";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";

// const chm = await fetch("chm_1000000.geojson").then((res) => res.json());

export default class GWFVisPluginGeoJSONGridLayer extends GWFVisMapLayerPluginBase {
  #tileLayerInstance?: leaflet.GridLayer;
  // #tileIndex: any;

  displayName: string = "GeoJSON Grid layer";
  type: LayerType = "overlay";
  active: boolean = false;
  urlTemplate?: string;
  // options?: leaflet.TileLayerOptions = {
  //   attribution:
  //     "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  // };

  obtainHeaderCallback = () => `Tile Layer - ${this.displayName}`;

  protected override initializeMapLayer() {
    this.#tileLayerInstance &&
      this.removeMapLayerDelegate?.(this.#tileLayerInstance);

    // this.#tileIndex = geojsonvt(chm, {});

    // const CanvasLayer: any = this.leaflet?.GridLayer.extend({
    //   createTile: ({ x, y, z }: { x: number; y: number; z: number }) => {
    //     debugger;
    //     // create a <canvas> element for drawing
    //     var tile = this.leaflet?.DomUtil.create("canvas", "leaflet-tile");

    //     const feature = this.obtainTile(x, y, z);

    //     // return the tile so it can be rendered on screen
    //     return tile;
    //   },
    // });

    // TODO dirty fix
    this.leaflet && ((this.leaflet.DomEvent as any).fakeStop = () => true);

    this.#tileLayerInstance = this.leaflet?.vectorGrid.protobuf(
      this.urlTemplate ?? '',
      // 'chm_1000000/{z}/{x}/{y}.pbf',
      {
        rendererFactory: this.leaflet?.canvas.tile,
        interactive: true,
        maxNativeZoom: 16,
        vectorTileLayerStyles: {
          default: (() => ({
            weight: 1,
            color: "hsl(0, 0%, 50%)",
            fillColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            fill: true,
          })) as any,
        },
      }
    );
    // this.#tileLayerInstance = this.leaflet?.vectorGrid.slicer(chm, {
    //   rendererFactory: this.leaflet?.canvas.tile,
    //   interactive: true,
    //   vectorTileLayerStyles: {
    //     sliced: { weight: 1 },
    //   },
    // });
    this.#tileLayerInstance?.on("click", ({ layer: { properties } }) =>
      alert(JSON.stringify(properties))
    );
    this.#tileLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#tileLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
  }
}
