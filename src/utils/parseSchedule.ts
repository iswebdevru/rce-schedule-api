export type Subject = {
  index: number;
  title: string;
  cabinet: string;
};

export interface Schedule {
  group: string;
  subjects: Subject[];
}

export function parseSchedule(text: string) {
  let groups: RegExpMatchArray | null = null;
  let currentSubjectIndexMatch: RegExpMatchArray | null = null;
  let currentSubjectTitleMatch: RegExpMatchArray | null = null;
  let currentCabinetMatch: RegExpMatchArray | null = null;
  let currentSubjectIndex = -1;
  let prevSubjectIndex = -1;
  let currentSubjectTitle = '';
  let currentCabinet = '';
  let groupCount = -1;
  let currentGroupIndex = -1;
  let result: Schedule[] = [];
  let isOpened = false;

  for (const line of text.split('\n')) {
    groups = line.match(/[а-яА-Я]+-\d+/g);
    if (groups) {
      isOpened = false;
      result = result.concat(groups.map(group => ({ group, subjects: [] })));
      groupCount = groups.length;
      currentGroupIndex = result.length - groupCount;
      continue;
    }
    if (!result.length) {
      continue;
    }
    currentSubjectIndexMatch = line.match(/^([0-7])\D|\s+7/);
    if (currentSubjectIndexMatch) {
      prevSubjectIndex = currentSubjectIndex;
      currentSubjectIndex = parseInt(currentSubjectIndexMatch[1]);
      isOpened = !isOpened;
      if (
        currentSubjectIndex &&
        (currentSubjectIndex === prevSubjectIndex ||
          currentSubjectIndex - prevSubjectIndex !== 1)
      ) {
        continue;
      }
      currentSubjectTitle = line.replace(/^\s|^\d\s|\s$/g, '');
      if (currentSubjectTitle) {
        result[currentGroupIndex].subjects[currentSubjectIndex] = {
          index: currentSubjectIndex,
          title: currentSubjectTitle,
          cabinet: '',
        };
      }
      continue;
    }
    if (!isOpened) {
      continue;
    }
    currentCabinetMatch = line.match(/^(\d{1,3}|[а-яА-Я]\d+|д|лаб|\s*$)/);
    if (currentCabinetMatch) {
      currentCabinet = currentCabinetMatch[0].trim();
      if (
        !currentCabinet &&
        !result[currentGroupIndex].subjects[currentSubjectIndex]
      ) {
        result[currentGroupIndex].subjects[currentSubjectIndex] = {
          index: currentSubjectIndex,
          title: '',
          cabinet: '',
        };
      } else {
        result[currentGroupIndex].subjects[currentSubjectIndex].cabinet =
          currentCabinet;
        currentGroupIndex +=
          currentGroupIndex + 1 === result.length ? 1 - groupCount : 1;
      }
      continue;
    }
    currentSubjectTitleMatch = line.match(/[a-zA-Zа-яА-Я\-\.\s\d]+/);
    if (currentSubjectTitleMatch) {
      currentSubjectTitle = currentSubjectTitleMatch[0].trim();
      result[currentGroupIndex].subjects[currentSubjectIndex] = {
        index: currentSubjectIndex,
        title: currentSubjectTitle,
        cabinet: '',
      };
    }
  }
  return result;
}
