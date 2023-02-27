import type { SqlValue } from "sql.js";
import type { CallerPlugin } from "./basic";
import type { GWFVisDefaultPluginSharedStates } from "./state";

export type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

export type Dimension = {
  id: number;
  name: string;
  size: number;
  description?: string;
  value_labels?: string[];
};

export type VariableWithDimensions = Variable & {
  dimensions?: Dimension[];
};

export type Location = {
  id: number;
  geometry: GeoJSON.Geometry;
  metadata: unknown;
};

export type Value = {
  location: Location;
  value: number;
  variable: Variable;
  dimensionIdAndValueDict: { [dimensionId: number]: number | undefined };
};

export async function obtainAvailableVariables(
  dataSource: string | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || !callerPlugin) {
    return;
  }
  const variables = obtainAvailableVariablesFromCache(dataSource, callerPlugin);
  if (variables) {
    return variables;
  }
  await cacheAvailableVariablesIfNotCached(dataSource, callerPlugin);
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  return sharedStates?.["gwf-default.cache.availableVariablesDict"]?.[
    dataSource
  ];
}

export async function obtainAvailableLocations(
  dataSource: string | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || !callerPlugin) {
    return;
  }
  return queryLocations(dataSource, callerPlugin);
}

function obtainAvailableVariablesFromCache(
  dataSource: string,
  callerPlugin: CallerPlugin
) {
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  const variables =
    sharedStates?.["gwf-default.cache.availableVariablesDict"]?.[dataSource];
  return variables;
}

async function cacheAvailableVariablesIfNotCached(
  dataSource: string,
  callerPlugin: CallerPlugin
) {
  if (obtainAvailableVariablesFromCache(dataSource, callerPlugin)) {
    return;
  }
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  let availablVariablesDict =
    sharedStates?.["gwf-default.cache.availableVariablesDict"];
  if (!availablVariablesDict) {
    availablVariablesDict = callerPlugin.sharedStates[
      "gwf-default.cache.availableVariablesDict"
    ] = {};
  }
  const variables = await queryVariables(dataSource, callerPlugin);
  availablVariablesDict[dataSource] = variables;
  return variables;
}

async function queryVariables(dataSource: string, callerPlugin: CallerPlugin) {
  let sql = `SELECT id, name, unit, description FROM variable`;
  let sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const variables = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => [
          sqlResult?.columns?.[columnIndex],
          value,
        ])
      ) as Variable
  );
  const dimensions = await queryDimensions(dataSource, callerPlugin);
  await fillCorrespondingDimensionsIntoVariables(
    dataSource,
    variables,
    dimensions,
    callerPlugin
  );
  return variables;
}

async function queryDimensions(dataSource: string, callerPlugin: CallerPlugin) {
  const sql = `SELECT id, name, size, description, value_labels FROM dimension`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const dimensions = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => {
          const columnName = sqlResult?.columns?.[columnIndex];
          if (columnName === "value_labels") {
            value = value ? JSON.parse(value as string) : undefined;
          }
          return [columnName, value as SqlValue | string[]];
        })
      ) as Dimension
  );
  return dimensions;
}

async function queryLocations(dataSource: string, callerPlugin: CallerPlugin) {
  const sql = `SELECT id, geometry, metadata FROM location`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const locations = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => {
          const columnName = sqlResult?.columns?.[columnIndex];
          if (columnName === "geometry" || columnName === "metadata") {
            value = value ? JSON.parse(value as string) : undefined;
          }
          return [columnName, value as any];
        })
      ) as Location
  );
  return locations;
}

async function fillCorrespondingDimensionsIntoVariables(
  dataSource: string,
  variables: Variable[] | undefined,
  dimensions: Dimension[] | undefined,
  callerPlugin: CallerPlugin
) {
  const sql = `SELECT variable, dimension FROM variable_dimension`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  sqlResult?.values?.forEach(([variableId, dimensionId]) => {
    const variable = variables?.find((variable) => variable.id === variableId);
    const dimension = dimensions?.find(
      (dimension) => dimension.id === dimensionId
    );
    if (!variable) {
      return;
    }
    let variableDimensions = (variable as VariableWithDimensions).dimensions;
    if (!variableDimensions) {
      variableDimensions = (variable as VariableWithDimensions).dimensions = [];
    }
    dimension && variableDimensions.push(dimension);
  });
}
