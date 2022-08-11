import { Component, Host, h, ComponentInterface, Method, Prop, State, Watch } from '@stencil/core';
import { GloablInfo, GwfVisPlugin } from '../../utils/gwf-vis-plugin';

export type Dimension = {
  id: number;
  name: string;
  size: number;
  description?: string;
  value_labels?: string[];
};

@Component({
  tag: 'gwf-vis-plugin-dimension-control',
  styleUrl: 'gwf-vis-plugin-dimension-control.css',
  shadow: true,
})
export class GwfVisPluginDimensionControl implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-dimension-control';

  @State() dimensions: Dimension[];
  @State() dimension: Dimension;

  @State() value: number = 0;

  @Watch('value')
  handleValueChange(value: number) {
    const updatedGlobalInfo = { ...this.globalInfo };
    updatedGlobalInfo.dimensionDict = { ...updatedGlobalInfo.dimensionDict };
    updatedGlobalInfo.dimensionDict[this.dimension.name] = value;
    this.delegateOfUpdatingGlobalInfo(updatedGlobalInfo);
  }

  @Prop() delegateOfFetchingData: (query: any) => Promise<any>;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfo: GloablInfo) => void;
  @Prop() datasetId: string;

  async componentWillLoad() {
    this.dimensions = await this.delegateOfFetchingData({
      type: 'dimensions',
      from: this.datasetId,
    });
    this.dimension = this.dimensions?.[0];
    this.handleValueChange(this.value);
  }

  componentShouldUpdate(newValue: any, _oldValue: any, propName: string) {
    if (propName === 'globalInfo') {
      const newDimensionValue = newValue?.dimensionDict?.[this.dimension?.name];
      if (typeof newDimensionValue === 'number' && this.value !== newValue?.dimensionDict?.[this.dimension?.name]) {
        this.value = newDimensionValue;
      }
      return false;
    }
  }

  @Method()
  async obtainHeader() {
    return 'Dimension Control';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <select style={{ width: '100%' }} onChange={({ currentTarget }) => (this.dimension = this.dimensions?.find(d => d.id === +(currentTarget as HTMLSelectElement).value))}>
            {this.dimensions?.map(dimension => {
              return (
                <option value={dimension.id} title={dimension.description} selected={this.dimension === dimension}>
                  {dimension.name}
                </option>
              );
            })}
          </select>
          <div>{this.dimension?.description}</div>
          <div id="range-container">
            <span>0</span>
            <input
              type="range"
              min={0}
              max={this.dimension?.size - 1}
              value={this.value}
              style={{ width: '100%' }}
              onChange={({ currentTarget }) => {
                this.value = +(currentTarget as HTMLInputElement).value;
              }}
            />
            <span>{this.dimension?.size ?? 'N/A'}</span>
          </div>
          <div>
            <b>Current Value: </b>
            {this.value ?? 'N/A'}
          </div>
        </div>
      </Host>
    );
  }
}
