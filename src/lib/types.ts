// Content Types for Axiom Reader

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  description?: string;
  coverImage?: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  sections: SectionMeta[];
}

export interface SectionMeta {
  id: string;
  number: number;
  title: string;
  slug: string;
}

export interface Section {
  id: string;
  title: string;
  chapter: number;
  section: number;
  book: string;
  objectives?: string[];
  devotional?: Devotional;
  epigraph?: Epigraph;
  content: ContentBlock[];
  exercises?: string[];
  marginNotes?: MarginNote[];
}

export interface Devotional {
  title: string;
  scripture: string;
  content: string;
  reflection?: string;
}

export interface Epigraph {
  text: string;
  reference: string;
  quote?: string;
  quoteAuthor?: string;
}

export interface MarginNote {
  type: 'scripture' | 'quote';
  reference?: string;
  author?: string;
  text: string;
}

// Content Blocks
export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | DefinitionBlock
  | TheoremBlock
  | ExampleBlock
  | ProofBlock
  | FigureBlock
  | ListBlock
  | TableBlock
  | ExerciseBlock
  | WarningBlock
  | CautionBlock
  | HistoricalBlock
  | KeyConceptBlock
  | SummaryBlock
  | RemarkBlock
  | AlgorithmBlock
  | MethodBlock
  | ConnectionBlock
  | TipBlock;

interface BaseBlock {
  edition?: 'christian' | 'secular';
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 2 | 3 | 4;
  text: string;
}

export interface DefinitionBlock extends BaseBlock {
  type: 'definition';
  id: string;
  number?: string;
  title: string;
  content: string;
}

export interface TheoremBlock extends BaseBlock {
  type: 'theorem' | 'lemma' | 'corollary' | 'postulate';
  id: string;
  number?: string;
  title: string;
  content: string;
  label?: string;
}

export interface ExampleBlock extends BaseBlock {
  type: 'example';
  id: string;
  number?: string;
  title?: string;
  problem: string;
  solution: string;
}

export interface ProofBlock extends BaseBlock {
  type: 'proof';
  content: string;
}

export interface FigureBlock extends BaseBlock {
  type: 'figure';
  id: string;
  src: string;
  caption: string;
  alt?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  headers?: string[];
  rows: string[][];
  alignment?: ('left' | 'center' | 'right')[];
  caption?: string;
}

export interface ExerciseBlock extends BaseBlock {
  type: 'exercise';
  id?: string;
  number?: string;
  problem?: string;
  content?: string;
  solution?: string;
  hint?: string;
  answer?: string;
  proof?: boolean;
  creation_reveals?: boolean;
  challenging?: boolean;
}

export interface WarningBlock extends BaseBlock {
  type: 'warning' | 'important';
  id?: string;
  title?: string;
  content: string;
}

export interface CautionBlock extends BaseBlock {
  type: 'caution';
  id?: string;
  title?: string;
  content?: string;
  text?: string;
}

export interface HistoricalBlock extends BaseBlock {
  type: 'historical' | 'historical_note';
  content?: string;
  text?: string;
}

export interface KeyConceptBlock extends BaseBlock {
  type: 'keyconcept' | 'context' | 'strategy';
  id?: string;
  title?: string;
  content: string;
}

export interface SummaryBlock extends BaseBlock {
  type: 'summary';
  id?: string;
  title?: string;
  content: string;
}

export interface RemarkBlock extends BaseBlock {
  type: 'remark';
  id?: string;
  title?: string;
  content: string;
}

export interface AlgorithmBlock extends BaseBlock {
  type: 'algorithm';
  id?: string;
  number?: string;
  title?: string;
  content: string;
}

export interface MethodBlock extends BaseBlock {
  type: 'method';
  id?: string;
  title?: string;
  content: string;
}

export interface ConnectionBlock extends BaseBlock {
  type: 'connection';
  id?: string;
  title?: string;
  content: string;
}

export interface TipBlock extends BaseBlock {
  type: 'tip';
  id?: string;
  title?: string;
  content: string;
}

// Navigation
export interface NavItem {
  book: string;
  chapter: number;
  section: number;
  title: string;
  slug: string;
}

// Edition context
export type Edition = 'christian' | 'secular';
