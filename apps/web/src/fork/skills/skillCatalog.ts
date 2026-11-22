import type { ServerProviderSkill } from "@t3tools/contracts";
import {
  AccessibilityIcon,
  DraftingCompassIcon,
  EraserIcon,
  FileCheckIcon,
  GitBranchIcon,
  HandGrabIcon,
  MonitorPlayIcon,
  NewspaperIcon,
  PartyPopperIcon,
  RepeatIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  TagIcon,
  BookOpenIcon,
  BoxIcon,
  BracesIcon,
  BrainIcon,
  BrushIcon,
  ClapperboardIcon,
  CodeXmlIcon,
  ComponentIcon,
  FileTextIcon,
  FlaskConicalIcon,
  GalleryHorizontalEndIcon,
  GaugeIcon,
  GemIcon,
  HandIcon,
  LayersIcon,
  LayoutGridIcon,
  LightbulbIcon,
  ListChecksIcon,
  type LucideIcon,
  MegaphoneIcon,
  MessageCircleQuestionIcon,
  MousePointerClickIcon,
  PaletteIcon,
  PenLineIcon,
  PenToolIcon,
  RocketIcon,
  Rows3Icon,
  ScaleIcon,
  ScanEyeIcon,
  ScrollTextIcon,
  ShapesIcon,
  SmartphoneIcon,
  WavesIcon,
  TimerIcon,
  TypeIcon,
  HeartIcon,
  WrenchIcon,
} from "lucide-react";

/** A skill with a hand-written title, one-line pitch and icon, shown in the gallery. */
interface CatalogEntry {
  readonly title: string;
  readonly pitch: string;
  readonly icon: LucideIcon;
}

/**
 * Emil Kowalski's design engineering skills (aiforui), keyed by the folder name they install as.
 * Entries for skills you have not installed are harmless: they appear once you install them.
 */
const EMIL: Record<string, CatalogEntry> = {
  "emil-prototype": {
    title: "Prototyping",
    pitch: "Build several variants before settling on one.",
    icon: GalleryHorizontalEndIcon,
  },
  "emil-product-thinking": {
    title: "Product Thinking",
    pitch: "Grills you on a product idea before you build it.",
    icon: ScaleIcon,
  },
  "emil-design-vocabulary": {
    title: "Design Vocabulary",
    pitch: "The exact name for a design idea you can only describe.",
    icon: Rows3Icon,
  },
  "emil-engineering-vocabulary": {
    title: "Engineering Vocabulary",
    pitch: "The exact name for a frontend behavior or browser quirk.",
    icon: BracesIcon,
  },
  "emil-ask-emil": {
    title: "Ask Emil",
    pitch: "Which of these skills fits, and in what order.",
    icon: MessageCircleQuestionIcon,
  },
  "emil-typography": {
    title: "Typography",
    pitch: "Fonts, scales, leading and tracking for the web.",
    icon: TypeIcon,
  },
  "emil-color": {
    title: "Color",
    pitch: "Palettes, contrast and dark mode in OKLCH.",
    icon: PaletteIcon,
  },
  "emil-surfaces": {
    title: "Surface & Depth",
    pitch: "Shadows, borders, gradients and depth.",
    icon: LayersIcon,
  },
  "emil-design-foundations": {
    title: "Design Foundations",
    pitch: "Hierarchy, spacing, type and color as right and wrong pairs.",
    icon: LayoutGridIcon,
  },
  "emil-component-design": {
    title: "Component Design",
    pitch: "React APIs that are composable and hard to misuse.",
    icon: ComponentIcon,
  },
  "emil-forms-and-inputs": {
    title: "Forms & Inputs",
    pitch: "Inputs, buttons and validation that feel right.",
    icon: PenLineIcon,
  },
  "emil-animations": {
    title: "Animations",
    pitch: "When to animate, and the easing, duration and springs to use.",
    icon: WavesIcon,
  },
  "emil-ask-lapse": {
    title: "Ask Lapse",
    pitch: "Slow time down, record takes and scrub your animations.",
    icon: TimerIcon,
  },
  "emil-design-system-docs": {
    title: "Design System Docs",
    pitch: "Write a DESIGN.md an agent can actually follow.",
    icon: BookOpenIcon,
  },
  "emil-marketing-pages": {
    title: "Marketing Pages",
    pitch: "Landing pages, blogs and changelogs, with restraint.",
    icon: MegaphoneIcon,
  },
  "emil-ui-polish": {
    title: "UI Polish",
    pitch: "The invisible details that make it feel finished.",
    icon: GemIcon,
  },
  "emil-interaction-details": {
    title: "Interaction Details",
    pitch: "Delays, thresholds and velocity that respond like a hand expects.",
    icon: MousePointerClickIcon,
  },
  "emil-performance": {
    title: "Performance",
    pitch: "Virtualize, preload and keep motion off the main thread.",
    icon: GaugeIcon,
  },
  "emil-touch-and-accessibility": {
    title: "Touch & Accessibility",
    pitch: "Tap targets, focus and screen readers done right.",
    icon: HandIcon,
  },
  "emil-mobile-native": {
    title: "Mobile Native",
    pitch: "Make a web app feel installed on a phone.",
    icon: SmartphoneIcon,
  },
  "emil-ui-review": {
    title: "UI Review",
    pitch: "Review UI code the way a design engineer would.",
    icon: ScanEyeIcon,
  },
  "emil-prep-for-prod": {
    title: "Prep for Prod",
    pitch: "A pre-launch sweep across nine lanes.",
    icon: RocketIcon,
  },
  "emil-unslop-design": {
    title: "Unslop Design",
    pitch: "Take out the AI look: gradients, glass, emoji grids.",
    icon: BrushIcon,
  },
  "emil-unslop-writing": {
    title: "Unslop Writing",
    pitch: "Put a human voice back into your prose.",
    icon: PenToolIcon,
  },
  "emil-unslop-code": {
    title: "Unslop Code",
    pitch: "Strip the tells that mark code as AI-written.",
    icon: CodeXmlIcon,
  },
  "emil-get-creative": {
    title: "Get Creative",
    pitch: "Get unstuck when all you have is a vibe.",
    icon: LightbulbIcon,
  },
  "emil-build-a-tool": {
    title: "Build a Tool",
    pitch: "The tool that gets you to what you're really building.",
    icon: WrenchIcon,
  },
  "emil-borrow-a-brain": {
    title: "Borrow a Brain",
    pitch: "Turn someone's public work into a skill that thinks like them.",
    icon: BrainIcon,
  },
  "emil-package-my-work": {
    title: "Package My Work",
    pitch: "Turn UI and motion work into short videos for launch posts.",
    icon: ClapperboardIcon,
  },
  "emil-writing-skills": {
    title: "Writing Skills",
    pitch: "Skill files that actually change what an agent does.",
    icon: ScrollTextIcon,
  },
  "emil-learn-taste": {
    title: "Learn Taste",
    pitch: "Turn your design corrections into rules the next agent follows.",
    icon: HeartIcon,
  },
};

/** The `dxe-` design engineering skills from kemiljk/skills. */
const DXE: Record<string, CatalogEntry> = {
  dxe: {
    title: "DXE Review",
    pitch: "A design engineering pass over a repo or a screen.",
    icon: ScanSearchIcon,
  },
  "dxe-design-engineering": {
    title: "Design Engineering",
    pitch: "Turn design intent into production components.",
    icon: DraftingCompassIcon,
  },
  "dxe-design-for-repetition": {
    title: "Design for Repetition",
    pitch: "Smooth the workflows people repeat every day.",
    icon: RepeatIcon,
  },
  "dxe-design-system-evolution": {
    title: "Design System Evolution",
    pitch: "Reuse a component, add a variant, or make a new pattern.",
    icon: GitBranchIcon,
  },
  "dxe-fluid-design": {
    title: "Fluid Design",
    pitch: "Springs, gestures and motion you can interrupt.",
    icon: HandGrabIcon,
  },
  "dxe-interaction-contracts": {
    title: "Interaction Contracts",
    pitch: "What an interaction promises: triggers, states, recovery.",
    icon: FileCheckIcon,
  },
  "dxe-interface-affordances": {
    title: "Interface Affordances",
    pitch: "Make hidden actions and weak targets obvious.",
    icon: MousePointerClickIcon,
  },
  "dxe-modern-css-html": {
    title: "Modern CSS & HTML",
    pitch: "Native features instead of legacy workarounds.",
    icon: CodeXmlIcon,
  },
  "dxe-product-delight": {
    title: "Product Delight",
    pitch: "Care, anticipation and feedback that feel thoughtful.",
    icon: PartyPopperIcon,
  },
  "dxe-prototype-to-production": {
    title: "Prototype to Production",
    pitch: "Harden a prototype: failure states, accessibility, security.",
    icon: ShieldCheckIcon,
  },
  "dxe-real-content-design": {
    title: "Real Content Design",
    pitch: "Shape layouts with real content, not placeholders.",
    icon: NewspaperIcon,
  },
  "dxe-semantic-html-first": {
    title: "Semantic HTML First",
    pitch: "The right elements and behavior for every control.",
    icon: TagIcon,
  },
  "dxe-subtractive-design": {
    title: "Subtractive Design",
    pitch: "Cut the noise and question every addition.",
    icon: EraserIcon,
  },
};

/** Skills outside any collection that still get a hand-picked icon and pitch. */
const OTHERS: Record<string, CatalogEntry> = {
  stageshow: {
    title: "Stageshow",
    pitch: "Faux product UI and animated demos with a cursor.",
    icon: MonitorPlayIcon,
  },
};

const ENTRIES: Record<string, CatalogEntry> = { ...EMIL, ...DXE, ...OTHERS };

export interface CollectionSection {
  /** Empty for a collection shown as one plain list. */
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly skills: readonly string[];
}

/** The order Emil's skills are meant to be used in, from deciding what to build to shipping it. */
const EMIL_SECTIONS: readonly CollectionSection[] = [
  {
    number: "01",
    title: "Before you build",
    description:
      "Figure out what to build, try a few versions of it, and find the right words to ask for it.",
    skills: [
      "emil-prototype",
      "emil-product-thinking",
      "emil-design-vocabulary",
      "emil-engineering-vocabulary",
      "emil-ask-emil",
    ],
  },
  {
    number: "02",
    title: "The foundation",
    description: "Type, color, and depth.",
    skills: ["emil-typography", "emil-color", "emil-surfaces"],
  },
  {
    number: "03",
    title: "Building the interface",
    description:
      "The pieces you put on top of the foundation: components, forms, motion, and the docs around them.",
    skills: [
      "emil-component-design",
      "emil-forms-and-inputs",
      "emil-animations",
      "emil-ask-lapse",
      "emil-design-system-docs",
    ],
  },
  {
    number: "04",
    title: "Refining and reviewing",
    description:
      "Go the extra mile. Make it fast, accessible, and native on a phone, then check it before it ships.",
    skills: [
      "emil-ui-polish",
      "emil-interaction-details",
      "emil-performance",
      "emil-touch-and-accessibility",
      "emil-mobile-native",
      "emil-ui-review",
      "emil-prep-for-prod",
    ],
  },
  {
    number: "05",
    title: "Cleaning up after the agent",
    description:
      "Agents leave tells in the design and the writing. These find them and take them out.",
    skills: ["emil-unslop-design", "emil-unslop-writing"],
  },
  {
    number: "06",
    title: "Getting more out of your agent",
    description: "Skills that make tools, new skills, and new ideas.",
    skills: [
      "emil-get-creative",
      "emil-build-a-tool",
      "emil-borrow-a-brain",
      "emil-package-my-work",
      "emil-writing-skills",
      "emil-learn-taste",
    ],
  },
];

/** The part of a skill's name after any `plugin:` prefix. */
function baseName(name: string): string {
  return name.slice(name.lastIndexOf(":") + 1);
}

export type CollectionId = "emil" | "dxe";

export interface Collection {
  readonly id: CollectionId;
  readonly label: string;
  readonly sections: readonly CollectionSection[];
}

const flat = (skills: readonly string[]): readonly CollectionSection[] => [
  { number: "", title: "", description: "", skills },
];

/** The collections that get their own filter, in the order the filters show. */
export const COLLECTIONS: readonly Collection[] = [
  { id: "emil", label: "Emil Kowalski", sections: EMIL_SECTIONS },
  { id: "dxe", label: "DXE", sections: flat(Object.keys(DXE)) },
];

const COLLECTION_OF = new Map(
  COLLECTIONS.flatMap((collection) =>
    collection.sections.flatMap((section) =>
      section.skills.map((name) => [name, collection.id] as const),
    ),
  ),
);

export function collectionOf(skill: Pick<ServerProviderSkill, "name">): CollectionId | null {
  return COLLECTION_OF.get(baseName(skill.name)) ?? null;
}

/** Icons for the rest, picked from words in the name. The first match wins. */
const KEYWORD_ICONS: ReadonlyArray<readonly [RegExp, LucideIcon]> = [
  [/access|a11y|wcag/, AccessibilityIcon],
  [/perf|speed/, GaugeIcon],
  [/vocab|glossary/, Rows3Icon],
  [/anim|motion|scroll|gesture/, WavesIcon],
  [/color|palette/, PaletteIcon],
  [/typo|font/, TypeIcon],
  [/art|canvas|diorama|hairline|shader|generative/, ShapesIcon],
  [/test|eval|debug/, FlaskConicalIcon],
  [/pdf|docx|xlsx|pptx|doc|slides|writ/, FileTextIcon],
  [/plan|phase|milestone|task|gsd|todo|project|workflow/, ListChecksIcon],
  [/review|audit|check|verify/, ScanEyeIcon],
  [/mobile|ios|swift|native/, SmartphoneIcon],
  [/design|ui|ux|interface|figma|taste|polish|impeccable|layout/, PenToolIcon],
  [/code|api|frontend|css|html|react|engineer|component/, CodeXmlIcon],
  [/creat|idea|brain/, LightbulbIcon],
];

const ACRONYMS = new Set([
  "ai",
  "api",
  "css",
  "docx",
  "dxe",
  "gsd",
  "html",
  "mcp",
  "pdf",
  "pptx",
  "svg",
  "ui",
  "ux",
  "wcag",
  "xlsx",
]);

function humanize(name: string): string {
  return baseName(name)
    .split(/[-_\s]+/)
    .filter((word) => word !== "")
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export interface SkillPresentation {
  readonly title: string;
  readonly pitch: string;
  readonly icon: LucideIcon;
}

/** How a skill shows in the gallery: the catalog's words for Emil's, a best guess for the rest. */
export function presentSkill(
  skill: Pick<ServerProviderSkill, "name" | "description" | "shortDescription">,
): SkillPresentation {
  const name = baseName(skill.name);
  const entry = ENTRIES[name];
  if (entry !== undefined) return entry;
  const lower = name.toLowerCase();
  return {
    title: humanize(name),
    pitch: skill.shortDescription ?? skill.description ?? "",
    icon: KEYWORD_ICONS.find(([pattern]) => pattern.test(lower))?.[1] ?? BoxIcon,
  };
}

/** A collection's skills grouped into its sections, keeping only those in `skills`, in catalog order. */
export function groupCollectionSkills<T extends Pick<ServerProviderSkill, "name">>(
  collectionId: CollectionId,
  skills: readonly T[],
): Array<{ readonly section: CollectionSection; readonly skills: T[] }> {
  const collection = COLLECTIONS.find((candidate) => candidate.id === collectionId);
  const byName = new Map(skills.map((skill) => [baseName(skill.name), skill] as const));
  return (collection?.sections ?? [])
    .map((section) => ({
      section,
      skills: section.skills.flatMap((name) => {
        const skill = byName.get(name);
        return skill === undefined ? [] : [skill];
      }),
    }))
    .filter((group) => group.skills.length > 0);
}
