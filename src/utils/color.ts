import * as d3 from "d3";

export type ColorSchemeType = "quantize" | "sequential";

export type ColorSchemeDefinition = {
  type?: ColorSchemeType;
  scheme?: string | string[];
  reverse?: boolean;
};

export function generateColorScale(
  colorSchemeDefinition?: ColorSchemeDefinition
) {
  switch (colorSchemeDefinition?.type) {
    case "quantize":
      return generateQuantizeColorScale(
        colorSchemeDefinition?.scheme,
        colorSchemeDefinition?.reverse
      );

    default:
      return generateSequentialColorScale(
        colorSchemeDefinition?.scheme,
        colorSchemeDefinition?.reverse
      );
  }
}

function generateQuantizeColorScale(
  scheme?: string | string[],
  reverse: boolean = false
) {
  let resultScheme: any[] | undefined;
  if (Array.isArray(scheme)) {
    resultScheme = scheme;
  } else if (typeof scheme === "string") {
    const [_, name, count] = scheme.match(/(\w+)(\[\d+\])/) ?? [];
    resultScheme = (d3 as any)[name]?.[count];
  }
  if (!resultScheme) {
    resultScheme = [...d3.schemeRdBu[11]].reverse();
  }
  if (reverse) {
    resultScheme.reverse();
  }
  return d3.scaleQuantize(resultScheme);
}

function generateSequentialColorScale(
  scheme?: string | string[],
  reverse: boolean = false
) {
  let resultScheme: ((t: number) => any) | undefined;
  if (Array.isArray(scheme)) {
    resultScheme = d3.piecewise(d3.interpolate, scheme);
  }
  if (typeof scheme === "string") {
    resultScheme = (d3 as any)[scheme];
  }
  if (!resultScheme) {
    resultScheme = (t) => d3.interpolateRdBu(1 - t);
  }
  if (reverse) {
    resultScheme = (t) => resultScheme?.(1 - t);
  }
  return d3.scaleSequential(resultScheme);
}
