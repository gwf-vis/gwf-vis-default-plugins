import type { GwfVisPlugin, GwfVisDataProviderPlugin } from "gwf-vis-host";

const data: any = {
  number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  string: [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ],
};

export default class
  extends HTMLElement
  implements
    GwfVisPlugin,
    GwfVisDataProviderPlugin<[number, number], (string | number)[]>
{
  obtainHeader = () => "Sample Data";

  notifyLoadingCallback!: () => () => void;

  registerDataProviderCallback!: (
    identifier: string,
    pluginInstance: GwfVisDataProviderPlugin<
      [number, number],
      (string | number)[]
    >
  ) => void;

  queryData = async (dataSource: string, queryObject: [number, number]) =>
    data[dataSource]?.slice(queryObject?.[0], queryObject?.[1]) ?? [];

  connectedCallback() {
    this.registerDataProviderCallback("sample", this);
  }
}