import { Component, Host, h, ComponentInterface, Method, Prop, State, Watch } from '@stencil/core';
import { GloablInfo, GwfVisPlugin } from '../../utils/gwf-vis-plugin';
import { Variable } from '../gwf-vis-plugin-variable-control/gwf-vis-plugin-variable-control';

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

  @State() variables: Variable[];
  @State() dimensions: Dimension[];
  @State() activeDimensions: Dimension[];

  @State() dimension: Dimension;

  @Watch('dimension')
  handleDimensionChange(dimension: Dimension) {
    this.value = this.globalInfo?.dimensionDict[dimension.name] ?? 0;
  }

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
  @Prop() dataSource: string;

  async componentWillLoad() {
    this.variables = await this.delegateOfFetchingData({
      type: 'variables',
      from: this.dataSource,
    });
    this.activeDimensions = this.dimensions = await this.delegateOfFetchingData({
      type: 'dimensions',
      from: this.dataSource,
    });
    if (this.globalInfo?.variableName) {
      const dimensions = this.variables?.find(variable => (variable.name = this.globalInfo?.variableName))?.dimensions;
      this.activeDimensions = this.dimensions?.filter(dimension => dimensions.includes(dimension.name));
    }
    const updatedGlobalInfo = { ...this.globalInfo };
    updatedGlobalInfo.dimensionDict = Object.assign(
      updatedGlobalInfo.dimensionDict || {},
      Object.fromEntries(this.dimensions?.map(dimension => [dimension.name, this.globalInfo?.dimensionDict?.[dimension.name] ?? null])),
    );
    this.delegateOfUpdatingGlobalInfo(updatedGlobalInfo);
    this.dimension = this.dimensions?.[0];
    this.handleValueChange(this.value);
  }

  componentShouldUpdate(newValue: any, oldValue: any, propName: string) {
    if (propName === 'globalInfo') {
      if (newValue?.variableName && newValue?.variableName !== oldValue?.variableName) {
        const newDimensions = this.variables?.find(variable => variable.name == newValue?.variableName)?.dimensions;
        const oldDimensions = this.variables?.find(variable => variable.name == oldValue?.variableName)?.dimensions;
        this.activeDimensions = this.dimensions?.filter(dimension => newDimensions.includes(dimension.name));
        const addedDimensions = newDimensions?.filter(dimension => !oldDimensions?.includes(dimension));
        const removedDimensions = oldDimensions?.filter(dimension => !newDimensions?.includes(dimension));
        if (addedDimensions?.length || removedDimensions?.length) {
          const newDimensionDict = newValue?.dimensionDict || {};
          let message = `The current selected variable has different dimension definition from the previous selected variable."`;
          if (addedDimensions?.length) {
            message += `\nNew dimensions, which values are set to 0, are: ${addedDimensions.join(',')}.`;
            addedDimensions.forEach(dimension => (newDimensionDict[dimension] = 0));
          }
          if (removedDimensions?.length) {
            message += `\nInvalid dimensions, which values are set to NULL, are: ${removedDimensions.join(',')}.`;
            removedDimensions.forEach(dimension => (newDimensionDict[dimension] = null));
          }
          this.delegateOfUpdatingGlobalInfo(Object.assign(newValue || {}, { dimensionDict: newDimensionDict }));
          alert(message);
        }
      }

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
            {this.activeDimensions?.map(dimension => {
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
            <span>{this.dimension?.size - 1 ?? 'N/A'}</span>
          </div>
          <div>
            <b>Current Value: </b>
            {this.value ?? 'N/A'}
          </div>
          <hr />
          <div>
            {Object.entries(this.globalInfo?.dimensionDict || {}).map(([key, value]) => (
              <div>
                {key}: {value ?? 'N/A'}
              </div>
            ))}
          </div>
        </div>
      </Host>
    );
  }
}
