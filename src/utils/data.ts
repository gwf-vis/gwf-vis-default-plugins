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

export type DataFrom = {
  dataSource?: string;
  variableName?: string;
  secondaryVariableName?: string;
  tertiaryVariableName?: string;
  dimensionValueDict?: { [dimension: string]: number };
};

export type GWFVisDBQueryObject =
  | {
      for: "locations";
      filter?: { ids?: number[] };
    }
  | {
      for: "dimensions" | "variables";
      filter?: { ids?: number[]; names?: string[] };
    }
  | {
      for: "max-min-value";
      filter?: {
        locations?: number[];
        dimensions?: number[];
        variables?: number[];
      };
    }
  | {
      for: "values";
      filter?: {
        location?: number | number[];
        variable?: number | number[];
        dimensionIdAndValueDict?: {
          [dimensionId: number]: number | number[] | undefined;
        };
      };
    };
