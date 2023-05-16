import type { SharedStates } from "gwf-vis-host";
import type { DimensionValueDict, LocationSelection } from "./basic";
import type { VariableWithDimensions } from "./data";

export type GWFVisDefaultPluginSharedStates = SharedStates & {
  "gwf-default.currentDataSource"?: string;
  "gwf-default.currentVariableId"?: number;
  "gwf-default.dimensionValueDict"?: DimensionValueDict;
  "gwf-default.locationSelection"?: LocationSelection;
  "gwf-default.metadata"?: Record<string, any>;
} & {
  "gwf-default.cache.availableVariablesDict"?: {
    [dataSource: string]: VariableWithDimensions[] | undefined;
  };
};

export function obtainObjectChangedPropertyNameSet<T = any>(
  oldObject: any,
  newObject: any
) {
  let changedProps = new Set<keyof T | string>();
  for (let key in oldObject) {
    if (!(key in newObject)) {
      changedProps.add(key);
    } else {
      if (oldObject[key] !== newObject[key]) {
        changedProps.add(key);
      }
    }
  }
  for (let key in newObject) {
    if (!(key in oldObject)) {
      changedProps.add(key);
    }
  }
  return changedProps;
}
