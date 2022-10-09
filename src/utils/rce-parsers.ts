import { insert } from 'ramda';
import { DayWithChanges, Schedule } from '../contracts';

function normalizeInput(text: string) {
  return text.replace(/\n(\d) ([а-яА-Я])/g, (_, g1, g2) => `\n${g1}\n${g2}`);
}

function balancePieces(pieces: string[], i = 0): string[] {
  if (pieces.length >= 8) {
    return pieces;
  }
  if (pieces[i] === undefined) {
    return balancePieces(pieces.concat('', ''), i + 2);
  }
  if (pieces[i].trim() === '' && pieces[i + 1]?.trim() !== '') {
    return balancePieces(insert(i + 1, '', pieces), i + 2);
  }
  return balancePieces(pieces, i + 2);
}

function splitPieces(pieces: string[]) {
  const result: string[][] = [];
  for (let i = 0; i < pieces.length; i += 2) {
    result.push([pieces[i], pieces[i + 1]]);
  }
  return result;
}

export function parseRCESchedule(text: string) {
  text = normalizeInput(text);
  let groups: RegExpMatchArray | null = null;
  let currentSubjectIndexMatch: RegExpMatchArray | null = null;
  let subjectIndex = -1;
  let openedSubjectIndex = -1;
  let groupCounter = -1;
  let groupIndex = -1;
  let result: Schedule[] = [];
  let isOpenedToReadPieces = false;
  let isOpenedToAddSubjects = false;
  let pieces: string[] = [];

  for (const line of text.split('\n')) {
    groups = line.match(/[а-яА-Я]+-\d+/g);
    if (groups) {
      result = result.concat(groups.map(group => ({ group, subjects: [] })));
      groupCounter = groups.length;
      isOpenedToAddSubjects = true;
      isOpenedToReadPieces = false;
      subjectIndex = -1;
      openedSubjectIndex = -1;
      continue;
    }
    if (!isOpenedToAddSubjects) {
      continue;
    }
    currentSubjectIndexMatch = line.match(/^([0-6]) *$/);
    if (currentSubjectIndexMatch) {
      subjectIndex = parseInt(currentSubjectIndexMatch[1]);
      if (!isOpenedToReadPieces) {
        isOpenedToReadPieces = true;
        openedSubjectIndex = subjectIndex;
        pieces = [];
        continue;
      }
      if (subjectIndex === openedSubjectIndex) {
        isOpenedToReadPieces = false;
        groupIndex = result.length - groupCounter;
        for (const [subject, cabinet] of splitPieces(balancePieces(pieces))) {
          if (groupIndex === result.length) {
            break;
          }
          result[groupIndex++].subjects[subjectIndex] = {
            index: subjectIndex,
            title: subject.trim(),
            cabinet: cabinet.trim(),
          };
        }
        if (subjectIndex === 6) {
          isOpenedToAddSubjects = false;
        }
      } else {
        pieces.push(line);
        continue;
      }
      continue;
    }
    if (!isOpenedToReadPieces) {
      continue;
    }
    pieces.push(line);
  }
  return result;
}

/**
 * Parses the page which contains available schedules
 * @param text
 */
export function parseRCEDaysWithChanges(text: string): DayWithChanges[] {
  return [
    ...text.matchAll(/\/assets\/rasp\/(\d{2})(\d{2})(\d{4})(\d*).pdf/g),
  ].map(([_, day, month, year, version]) => ({
    day: +day,
    month: +month,
    year: +year,
    version: version ? +version : 0,
  }));
}
