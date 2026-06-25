/**
 * Visual spec parser (spec 5.4).
 *
 * The AI returns a structured JSON spec (often inside a ```json fenced block,
 * surrounded by prose). This module isolates that block, parses it, and
 * validates it into a strongly-typed VisualSpec the SVG renderer can trust.
 * Invalid or absent specs return null so the caller can simply skip rendering.
 *
 * Includes colorblind-safe palettes so every chart is usable by every student.
 * Pure module (no imports) -> fully testable headlessly.
 */

export type ColorVisionMode = 'standard' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export type VisualType = 'bar_chart' | 'line_chart' | 'number_line' | 'diagram' | 'map';

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface BaseVisualSpec {
  type: VisualType;
  title?: string;
  palette?: string[];
}

export interface BarChartSpec extends BaseVisualSpec {
  type: 'bar_chart';
  data: ChartData;
}

export interface LineChartSpec extends BaseVisualSpec {
  type: 'line_chart';
  data: ChartData;
}

export interface NumberLineSpec extends BaseVisualSpec {
  type: 'number_line';
  min: number;
  max: number;
  step?: number;
  marks?: number[];
}

export interface DiagramComponent {
  label: string;
  description?: string;
}

export interface DiagramSpec extends BaseVisualSpec {
  type: 'diagram';
  diagramType?: string;
  components: DiagramComponent[];
}

export interface MapRegion {
  label: string;
  value?: number;
}

export interface MapSpec extends BaseVisualSpec {
  type: 'map';
  regions: MapRegion[];
}

export type VisualSpec = BarChartSpec | LineChartSpec | NumberLineSpec | DiagramSpec | MapSpec;

/**
 * Colorblind-safe palettes (Okabe-Ito derived). 'standard' is already CB-safe;
 * the variants reorder/swap hues to maximize separation for each condition.
 */
export const PALETTES: Record<ColorVisionMode, string[]> = {
  standard: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'],
  deuteranopia: ['#0072B2', '#E69F00', '#F0E442', '#56B4E9', '#D55E00', '#CC79A7', '#999999', '#000000'],
  protanopia: ['#0072B2', '#E69F00', '#56B4E9', '#F0E442', '#CC79A7', '#D55E00', '#999999', '#000000'],
  tritanopia: ['#D55E00', '#0072B2', '#CC79A7', '#E69F00', '#009E73', '#56B4E9', '#999999', '#000000'],
};

/** Return `count` palette colors for a color-vision mode, cycling if needed. */
export function paletteFor(mode: ColorVisionMode = 'standard', count?: number): string[] {
  const base = PALETTES[mode] ?? PALETTES.standard;
  if (!count || count <= base.length) {
    return count ? base.slice(0, count) : base.slice();
  }
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(base[i % base.length]);
  }
  return out;
}

/** Attach a color-vision-appropriate palette sized to the spec's data. */
export function applyColorVisionPalette(spec: VisualSpec, mode: ColorVisionMode = 'standard'): VisualSpec {
  let count = 4;
  if (spec.type === 'bar_chart' || spec.type === 'line_chart') {
    count = spec.data.values.length;
  } else if (spec.type === 'diagram') {
    count = spec.components.length;
  } else if (spec.type === 'map') {
    count = spec.regions.length;
  }
  return { ...spec, palette: paletteFor(mode, Math.max(1, count)) };
}

/**
 * Extract the most likely JSON object string from free text:
 *  1) a ```json (or plain ```) fenced block, else
 *  2) the first balanced { ... } object.
 */
export function extractJsonBlock(text: string): string | null {
  if (!text) {
    return null;
  }

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1].trim()) {
    return fenceMatch[1].trim();
  }

  return extractFirstBalancedObject(text);
}

function extractFirstBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Parse free text into a validated VisualSpec, or null if no valid spec exists.
 * Optionally apply a colorblind palette in one step.
 */
export function parseVisualSpec(text: string, mode?: ColorVisionMode): VisualSpec | null {
  const block = extractJsonBlock(text);
  if (!block) {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(block);
  } catch {
    return null;
  }

  const spec = validateVisualSpec(raw);
  if (!spec) {
    return null;
  }
  return mode ? applyColorVisionPalette(spec, mode) : spec;
}

function asNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.map((v) => (typeof v === 'number' ? v : Number(v)));
  return out.every((n) => Number.isFinite(n)) ? out : null;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((v) => String(v));
}

/** Validate an unknown object into a VisualSpec (or null). */
export function validateVisualSpec(raw: unknown): VisualSpec | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  const title = typeof obj.title === 'string' ? obj.title : undefined;

  if (type === 'bar_chart' || type === 'line_chart') {
    const data = obj.data as Record<string, unknown> | undefined;
    if (!data) return null;
    const labels = asStringArray(data.labels);
    const values = asNumberArray(data.values);
    if (!labels || !values || labels.length === 0 || labels.length !== values.length) {
      return null;
    }
    return { type, title, data: { labels, values } };
  }

  if (type === 'number_line') {
    const min = Number(obj.min);
    const max = Number(obj.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      return null;
    }
    const step = Number.isFinite(Number(obj.step)) ? Number(obj.step) : undefined;
    const marks = asNumberArray(obj.marks) ?? undefined;
    return { type: 'number_line', title, min, max, step, marks };
  }

  if (type === 'diagram') {
    const rawComponents = Array.isArray(obj.components) ? obj.components : null;
    if (!rawComponents || rawComponents.length === 0) {
      return null;
    }
    const components: DiagramComponent[] = [];
    for (const item of rawComponents) {
      if (item && typeof item === 'object' && 'label' in item) {
        const c = item as Record<string, unknown>;
        components.push({
          label: String(c.label),
          description: typeof c.description === 'string' ? c.description : undefined,
        });
      }
    }
    if (components.length === 0) return null;
    return {
      type: 'diagram',
      title,
      diagramType: typeof obj.diagramType === 'string' ? obj.diagramType : undefined,
      components,
    };
  }

  if (type === 'map') {
    const rawRegions = Array.isArray(obj.regions) ? obj.regions : null;
    if (!rawRegions || rawRegions.length === 0) {
      return null;
    }
    const regions: MapRegion[] = [];
    for (const item of rawRegions) {
      if (item && typeof item === 'object' && 'label' in item) {
        const r = item as Record<string, unknown>;
        const value = Number(r.value);
        regions.push({ label: String(r.label), value: Number.isFinite(value) ? value : undefined });
      }
    }
    if (regions.length === 0) return null;
    return { type: 'map', title, regions };
  }

  return null;
}
