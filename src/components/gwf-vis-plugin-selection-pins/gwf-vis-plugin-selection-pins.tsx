import { Component, Host, h, ComponentInterface, Method, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginControl } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-selection-pins',
  styleUrl: 'gwf-vis-plugin-selection-pins.css',
  shadow: true,
})
export class GwfVisPluginSelectionPins implements ComponentInterface, GwfVisPluginControl {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-selection-pins';
  static readonly __PLUGIN_TYPE__ = 'control';

  private readonly defaultColors = ['#8CC63E', '#2989E3', '#724498', '#F02C89', '#FB943B', '#F4CD26'];

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async obtainHeader() {
    return 'Selection Pins';
  }

  render() {
    return (
      <Host>
        <div part="container">
          <div part="button-container">
            <button
              class="solid"
              onClick={() => {
                if (this.globalInfoDict?.userSelectionDict?.dataset && this.globalInfoDict?.userSelectionDict?.location && this.globalInfoDict?.userSelectionDict?.variable) {
                  if (!this.globalInfoDict.pinnedSelections) {
                    this.globalInfoDict.pinnedSelections = [];
                  }
                  this.updatingGlobalInfoDelegate({
                    ...this.globalInfoDict,
                    pinnedSelections: [
                      ...this.globalInfoDict.pinnedSelections,
                      {
                        dataset: this.globalInfoDict.userSelectionDict.dataset,
                        location: this.globalInfoDict.userSelectionDict.location,
                        variable: this.globalInfoDict.userSelectionDict.variable,
                        color: this.defaultColors.find(color => !this.globalInfoDict.pinnedSelections.map(pin => pin.color).includes(color)) || 'hsl(0, 0%, 0%)',
                      },
                    ],
                  });
                }
              }}
            >
              Pin Current
            </button>
            <button
              class="hollow"
              onClick={() => {
                if (this.globalInfoDict?.userSelectionDict?.dataset && this.globalInfoDict?.userSelectionDict?.location && this.globalInfoDict?.userSelectionDict?.variable) {
                  const pinnedSelections = this.globalInfoDict.pinnedSelections.filter(
                    pin =>
                      pin.dataset !== this.globalInfoDict?.userSelectionDict?.dataset ||
                      pin.location !== this.globalInfoDict?.userSelectionDict?.location ||
                      pin.variable !== this.globalInfoDict?.userSelectionDict?.variable,
                  );
                  this.updatingGlobalInfoDelegate({ ...this.globalInfoDict, pinnedSelections });
                }
              }}
            >
              Remove Current
            </button>
          </div>
          <div part="pin-container">
            {this.globalInfoDict?.pinnedSelections?.map(selection => (
              <button
                class="pin"
                style={{ background: selection.color }}
                title={`Dataset: ${selection.dataset}\nLocation: ${selection.location}\nVariable: ${selection.variable}`}
                onClick={() => {
                  const userSelectionDict = { dataset: selection.dataset, location: selection.location, variable: selection.variable };
                  this.updatingGlobalInfoDelegate({ ...this.globalInfoDict, userSelectionDict });
                }}
              ></button>
            )) || 'No pinned selection yet'}
          </div>
        </div>
      </Host>
    );
  }
}
