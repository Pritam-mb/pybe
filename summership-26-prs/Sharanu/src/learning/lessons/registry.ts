import type { Lesson } from "./types";
import zeroDivisionError from "./content/02-zero-division-error/content";
import typeError from "./content/03-type-error/content";
import valueError from "./content/04-value-error/content";
import indexError from "./content/05-index-error/content";
import keyError from "./content/06-key-error/content";
import attributeError from "./content/07-attribute-error/content";
import fileNotFoundError from "./content/08-file-not-found-error/content";
import elseClause from "./content/09-else-clause/content";
import finallyClause from "./content/10-finally/content";
import raiseKeyword from "./content/11-raise/content";
import recursionError from "./content/12-recursion-error/content";
import importError from "./content/13-import-error/content";
import exceptionHierarchy from "./content/14-exception-hierarchy/content";
import customExceptions from "./content/15-custom-exceptions/content";
import capstone from "./content/16-capstone/content";

// The full 16-lesson sequence — every content.ts from the framework, now wired in.
export const LESSONS: Lesson[] = [
  zeroDivisionError,
  typeError,
  valueError,
  indexError,
  keyError,
  attributeError,
  fileNotFoundError,
  elseClause,
  finallyClause,
  raiseKeyword,
  recursionError,
  importError,
  exceptionHierarchy,
  customExceptions,
  capstone,
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

export function getNextLesson(currentSlug: string): Lesson | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.slug === currentSlug);
  if (index === -1) return undefined;
  return LESSONS[index + 1];
}