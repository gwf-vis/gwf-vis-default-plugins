import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginControl } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-current-selection',
  styleUrl: 'gwf-vis-plugin-current-selection.css',
  shadow: true,
})
export class GwfVisPluginCurrentSelection implements ComponentInterface, GwfVisPluginControl {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-current-selection';
  static readonly __PLUGIN_TYPE__ = 'control';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async obtainHeader() {
    return 'Current Selection';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <div>
            <b>Dataset</b>: {this.globalInfoDict?.userSelectionDict?.dataset || 'No selection'}
          </div>
          <div>
            <b>Location ID</b>: {this.globalInfoDict?.userSelectionDict?.location || 'No selection'}
          </div>
          <div>
            <b>Variable</b>: {this.globalInfoDict?.userSelectionDict?.variable || 'No selection'}
          </div>
        </div>
      </Host>
    );
  }
}
