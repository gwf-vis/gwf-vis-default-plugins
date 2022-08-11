import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPlugin } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-selection',
  styleUrl: 'gwf-vis-plugin-selection.css',
  shadow: true,
})
export class GwfVisPluginCurrentSelection implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-selection';

  private readonly defaultColors = ['#8CC63E', '#2989E3', '#724498', '#F02C89', '#FB943B', '#F4CD26'];

  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;

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
              <b>Dataset</b>: {this.globalInfo?.userSelection?.dataset || 'No selection'}
            </div>
            <div>
              <b>Location ID</b>: {this.globalInfo?.userSelection?.location || 'No selection'}
            </div>
          </div>
          <div part="pin-section">
            <div part="button-container">
              <button
                class="solid"
                onClick={() => {
                  if (this.globalInfo?.userSelection?.dataset && this.globalInfo?.userSelection?.location) {
                    if (!this.globalInfo.pinnedSelections) {
                      this.globalInfo.pinnedSelections = [];
                    }
                    this.delegateOfUpdatingGlobalInfo({
                      ...this.globalInfo,
                      pinnedSelections: [
                        ...this.globalInfo.pinnedSelections,
                        {
                          dataset: this.globalInfo.userSelection.dataset,
                          location: this.globalInfo.userSelection.location,
                          color: this.defaultColors.find(color => !this.globalInfo.pinnedSelections.map(pin => pin.color).includes(color)) || 'hsl(0, 0%, 30%)',
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
                  if (this.globalInfo?.userSelection?.dataset && this.globalInfo?.userSelection?.location) {
                    const pinnedSelections = this.globalInfo.pinnedSelections.filter(
                      pin => pin.dataset !== this.globalInfo?.userSelection?.dataset || pin.location !== this.globalInfo?.userSelection?.location,
                    );
                    this.delegateOfUpdatingGlobalInfo({ ...this.globalInfo, pinnedSelections });
                  }
                }}
              >
                Remove Current
              </button>
            </div>
            <div part="pin-container">
              {this.globalInfo?.pinnedSelections?.length > 0
                ? this.globalInfo.pinnedSelections.map(selection => (
                    <button
                      class="pin"
                      style={{ background: selection.color }}
                      title={`Dataset: ${selection.dataset}\nLocation: ${selection.location}`}
                      onClick={() => {
                        const userSelection = { dataset: selection.dataset, location: selection.location };
                        this.delegateOfUpdatingGlobalInfo({ ...this.globalInfo, userSelection: userSelection });
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
