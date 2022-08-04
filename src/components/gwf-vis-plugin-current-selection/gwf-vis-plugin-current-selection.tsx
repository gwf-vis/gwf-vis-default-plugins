import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginSidebar } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-current-selection',
  styleUrl: 'gwf-vis-plugin-current-selection.css',
  shadow: true,
})
export class GwfVisPluginCurrentSelection implements ComponentInterface, GwfVisPluginSidebar {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-current-selection';
  static readonly __PLUGIN_FOR__ = 'sidebar';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() injectedCss: string;
  @Prop() pluginSlot: '' | 'top';

  render() {
    return (
      <Host slot={this.pluginSlot}>
        <style innerHTML={this.injectedCss}></style>
        <div part="header">Current Selection</div>
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
