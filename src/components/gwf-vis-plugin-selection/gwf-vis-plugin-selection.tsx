import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPlugin } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-selection',
  styleUrl: 'gwf-vis-plugin-selection.css',
  shadow: true,
})
export class GwfVisPluginCurrentSelection implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-selection';

  private readonly defaultColors = ['#8CC63E', '#2989E3', '#724498', '#F02C89', '#FB943B', '#F4CD26'];

  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async obtainHeader() {
    return 'Selection';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <div part="info-section">
            <div>
              <b>Dataset</b>: {this.globalInfoDict?.userSelectionDict?.dataset || 'No selection'}
            </div>
            <div>
              <b>Location ID</b>: {this.globalInfoDict?.userSelectionDict?.location || 'No selection'}
            </div>
          </div>
          <div part="pin-section">
            <div part="button-container">
              <button
                class="solid"
                onClick={() => {
                  if (this.globalInfoDict?.userSelectionDict?.dataset && this.globalInfoDict?.userSelectionDict?.location) {
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
                          color: this.defaultColors.find(color => !this.globalInfoDict.pinnedSelections.map(pin => pin.color).includes(color)) || 'hsl(0, 0%, 30%)',
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
                  if (this.globalInfoDict?.userSelectionDict?.dataset && this.globalInfoDict?.userSelectionDict?.location) {
                    const pinnedSelections = this.globalInfoDict.pinnedSelections.filter(
                      pin => pin.dataset !== this.globalInfoDict?.userSelectionDict?.dataset || pin.location !== this.globalInfoDict?.userSelectionDict?.location,
                    );
                    this.updatingGlobalInfoDelegate({ ...this.globalInfoDict, pinnedSelections });
                  }
                }}
              >
                Remove Current
              </button>
            </div>
            <div part="pin-container">
              {this.globalInfoDict?.pinnedSelections?.length > 0
                ? this.globalInfoDict.pinnedSelections.map(selection => (
                    <button
                      class="pin"
                      style={{ background: selection.color }}
                      title={`Dataset: ${selection.dataset}\nLocation: ${selection.location}`}
                      onClick={() => {
                        const userSelectionDict = { dataset: selection.dataset, location: selection.location };
                        this.updatingGlobalInfoDelegate({ ...this.globalInfoDict, userSelectionDict });
                      }}
                    ></button>
                  ))
                : 'No pinned selection yet'}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
