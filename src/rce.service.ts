import axios from 'axios';
import PdfParse = require('pdf-parse');
import { compose, curry, last, pluck, prop, sortBy } from 'ramda';
import { z } from 'zod';
import { ErrorProne } from './contracts';
import { normalizeDate } from './utils/date';
import {
  parseRCESchedulePage,
  parseRCESchedule,
  Schedule,
  ScheduleFileMetadata,
} from './utils/rce-parsers';

const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';
const RCE_SCHEDULE_PAGE = `${RCE_HOST}/obuchaushchimsya/raspisanie_zanyatii`;
const RCE_ASSETS_PAGE = `${RCE_HOST}/assets/rasp`;

export const RCEScheduleOptionsSchema = z.object({
  day: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  version: z.string().optional(),
});

export type RCEScheduleOptions = z.infer<typeof RCEScheduleOptionsSchema>;

function createScheduleFilename({
  day,
  month,
  year,
  version,
}: ScheduleFileMetadata) {
  return `${normalizeDate(day)}${normalizeDate(month)}${year}${
    version ? version : ''
  }.pdf`;
}

const filterRCEScheduleMetadataByDate = curry(
  (scheduleMetadata: ScheduleFileMetadata[], searchDate: Date) => {
    return scheduleMetadata.filter(({ day, month, year }) => {
      const sameDay = searchDate.getDate() === day;
      const sameMonth = searchDate.getMonth() + 1 === month;
      const sameYear = searchDate.getFullYear() === year;
      return sameDay && sameMonth && sameYear;
    });
  }
);

const convertRCEOptionsToDate = ({ year, month, day }: RCEScheduleOptions) => {
  const defaultDate = new Date();
  return new Date(
    typeof year === 'string' ? parseInt(year) : defaultDate.getFullYear(),
    typeof month === 'string' ? parseInt(month) - 1 : defaultDate.getMonth(),
    typeof day === 'string' ? parseInt(day) : defaultDate.getDate()
  );
};

const findNewestRCEScheduleMetadata = (
  scheduleMetadata: ScheduleFileMetadata[],
  options: RCEScheduleOptions
) =>
  compose(
    last<ScheduleFileMetadata>,
    sortBy(prop('version')),
    filterRCEScheduleMetadataByDate(scheduleMetadata),
    convertRCEOptionsToDate
  )(options);

export async function getAvailableRCEDaysWithChanges() {
  const { data } = await axios(RCE_SCHEDULE_PAGE);
  return typeof data === 'string' ? parseRCESchedulePage(data) : [];
}

export async function getRCEScheduleChanges(
  options: RCEScheduleOptions
): Promise<ErrorProne<Schedule[]>> {
  const scheduleMetadataList = await getAvailableRCEDaysWithChanges();
  const exactScheduleMetadata = findNewestRCEScheduleMetadata(
    scheduleMetadataList,
    options
  );
  if (!exactScheduleMetadata) {
    return {
      error: 'Not found',
      message:
        'Requested schedule with specified parameters does not exist. Try calling /days-with-changes to find available.',
    };
  }
  const filename = createScheduleFilename(exactScheduleMetadata);
  const response = await axios.get(`${RCE_ASSETS_PAGE}/${filename}`, {
    responseType: 'arraybuffer',
  });
  if (response.headers['content-type'] !== 'application/pdf') {
    return {
      error: 'Internal',
      message: `Wrong return type from ${RCE_HOST}`,
    };
  }
  const pdf = await PdfParse(response.data, { version: 'v2.0.550' });
  console.log(pdf);

  return {
    error: null,
    data: parseRCESchedule(pdf.text),
  };
}

export async function getRCEGroups() {
  const schedule = await getRCEScheduleChanges({});
  if (schedule.error !== null) {
    return schedule;
  }
  return {
    error: null,
    data: pluck('group', schedule.data),
  };
}
