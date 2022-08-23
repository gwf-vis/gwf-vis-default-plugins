import { Component, Host, h, ComponentInterface, Prop, Method, State, Watch } from '@stencil/core';
import { GwfVisPlugin, GloablInfo } from '../../utils/gwf-vis-plugin';

export type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

@Component({
  tag: 'gwf-vis-plugin-variable-control',
  styleUrl: 'gwf-vis-plugin-variable-control.css',
  shadow: true,
})
export class GwfVisPluginVariableControl implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-variable-control';

  @State() variables: Variable[];

  @State() variable: Variable;

  @Watch('variable')
  handleValueChange(value: Variable) {
    const updatedGlobalInfo = { ...this.globalInfo };
    updatedGlobalInfo.variableName = value.name;
    this.delegateOfUpdatingGlobalInfo(updatedGlobalInfo);
  }

  @Prop() delegateOfFetchingData: (query: any) => Promise<any>;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() dataSource: string;

  async componentWillLoad() {
    this.variables = await this.delegateOfFetchingData({
      type: 'variables',
      from: this.dataSource,
    });
    this.variable = this.variables?.[0];
  }

  @Method()
  async obtainHeader() {
    return 'Variable Control';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <select style={{ width: '100%' }} onChange={({ currentTarget }) => (this.variable = this.variables?.find(v => v.id === +(currentTarget as HTMLSelectElement).value))}>
            {this.variables?.map(variable => {
              return (
                <option value={variable.id} title={variable.description} selected={this.variable === variable}>
                  {variable.name}
                </option>
              );
            })}
          </select>
          <div>
            <b>Unit: </b>
            {this.variable?.unit}
          </div>
          <div>{this.variable?.description}</div>
        </div>
      </Host>
    );
  }
}
