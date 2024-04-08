import type {
  GWFVisPluginWithSharedStates,
  LayerType,
  SharedStates,
  leaflet,
} from "vga-vis-host";
import "leaflet.vectorgrid";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";
import * as d3 from "d3";

// const chm = await fetch("chm_1000000.geojson").then((res) => res.json());

export default class GWFVisPluginVectorGridLayer
  extends GWFVisMapLayerPluginBase
  implements GWFVisPluginWithSharedStates
{
  #vectorGridLayerInstance?: leaflet.GridLayer;
  // #tileIndex: any;

  displayName: string = "Vector Grid layer";
  type: LayerType = "overlay";
  active: boolean = false;
  urlTemplate?: string;
  fillColor?: { variable: string; thresholds: number[]; colors: [] };
  strokeColor?: { variable: string; thresholds: number[]; colors: [] };
  strokeWeight?: { variable: string; thresholds: number[]; weights: [] };
  maxNativeZoom?: number;
  maxZoom?: number;
  // options?: leaflet.TileLayerOptions = {
  //   attribution:
  //     "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  // };

  obtainHeaderCallback = () => `Tile Layer - ${this.displayName}`;

  sharedStates: SharedStates | undefined;
  updateSharedStatesDelegate?:
    | ((sharedStates: SharedStates) => void)
    | undefined;

  protected override initializeMapLayer() {
    this.#vectorGridLayerInstance &&
      this.removeMapLayerDelegate?.(this.#vectorGridLayerInstance);

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

    const scaleFillColor = this.fillColor
      ? d3
          .scaleThreshold(this.fillColor.colors ?? [])
          .domain(this.fillColor.thresholds)
      : () => null;
    const scaleStrokeColor = this.strokeColor
      ? d3
          .scaleThreshold(this.strokeColor.colors ?? [])
          .domain(this.strokeColor.thresholds)
      : () => null;
    const scaleStrokeWeight = this.strokeWeight
      ? d3
          .scaleThreshold(this.strokeWeight?.weights ?? [])
          .domain(this.strokeWeight.thresholds)
      : () => 1;

    this.#vectorGridLayerInstance = this.leaflet?.vectorGrid.protobuf(
      this.urlTemplate ?? "",
      // 'chm_1000000/{z}/{x}/{y}.pbf',
      {
        rendererFactory: this.leaflet?.canvas.tile,
        interactive: true,
        maxNativeZoom: this.maxNativeZoom,
        maxZoom: this.maxZoom,
        vectorTileLayerStyles: {
          gloric: ((metadata: any) => {
            return {
              weight: scaleStrokeWeight(
                metadata[this.strokeWeight?.variable ?? ""]
              ),
              color: scaleStrokeColor(
                metadata[this.strokeColor?.variable ?? ""]
              ),
              fillColor: scaleFillColor(
                metadata[this.fillColor?.variable ?? ""]
              ),
              fill: true,
            };
          }) as any,
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
    this.#vectorGridLayerInstance?.on("click", ({ layer: { properties } }) =>
      this.updateSharedStatesDelegate?.({
        ...this.sharedStates,
        "gwf-default.metadata": properties,
      })
    );
    this.#vectorGridLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#vectorGridLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
  }
}
