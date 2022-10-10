import axios from 'axios';
import { FastifyInstance } from 'fastify';
import PdfParse = require('pdf-parse');
import { pluck } from 'ramda';
import { z } from 'zod';
import {
  CachedSchedule,
  DayWithChanges,
  ErrorProne,
  Fleeting,
  Schedule,
} from './contracts';
import { safeJSONParse } from './utils/common';
import { normalizeDate } from './utils/date';
import { parseRCEDaysWithChanges, parseRCESchedule } from './utils/rce-parsers';

const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';
const RCE_SCHEDULE_PAGE = `${RCE_HOST}/obuchaushchimsya/raspisanie_zanyatii`;
const RCE_ASSETS_PAGE = `${RCE_HOST}/assets/rasp`;

const WEEK = 604800000;

const DAYS_WITH_CHANGES_CACHE_KEY = 'rce/days-with-changes';

export const RCEScheduleOptionsSchema = z.object({
  day: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  version: z.string().optional(),
});

export type RCEScheduleOptions = z.infer<typeof RCEScheduleOptionsSchema>;

function createScheduleFilename({ day, month, year, version }: DayWithChanges) {
  return `${normalizeDate(day)}${normalizeDate(month)}${year}${
    version ? version : ''
  }.pdf`;
}

function createScheduleCacheKey({ day, month, year }: DayWithChanges) {
  return `rce/schedule/${day}/${month}/${year}`;
}

async function getCachedDaysWithChanges(fastify: FastifyInstance) {
  const data = await fastify.redis.get(DAYS_WITH_CHANGES_CACHE_KEY);
  const cachedDays = data
    ? safeJSONParse<Fleeting<DayWithChanges>[]>(data)!
    : [];
  await Promise.all(
    cachedDays
      .filter(day => day.expiresIn < Date.now())
      .map(expiredDay => {
        return fastify.redis.del(createScheduleCacheKey(expiredDay.data));
      })
  );
  return cachedDays.filter(day => day.expiresIn > Date.now());
}

async function getUncachedDaysWitchChanges() {
  const { data } = await axios(RCE_SCHEDULE_PAGE);
  return parseRCEDaysWithChanges(data);
}

export async function getRCEDaysWithChanges(fastify: FastifyInstance) {
  const cachedDays = await getCachedDaysWithChanges(fastify);
  const fetchedDays = await getUncachedDaysWitchChanges();
  const updatedDays: Fleeting<DayWithChanges>[] = [];
  const newDays: Fleeting<DayWithChanges>[] = [];

  fetchedDays.forEach(freshDay => {
    const updatedDay = cachedDays.find(cachedDay => {
      return (
        cachedDay.data.day === freshDay.day &&
        cachedDay.data.month === freshDay.month &&
        cachedDay.data.year === freshDay.year &&
        cachedDay.data.version < freshDay.version
      );
    });
    const oldDay = cachedDays.find(cachedDay => {
      return (
        cachedDay.data.day === freshDay.day &&
        cachedDay.data.month === freshDay.month &&
        cachedDay.data.year === freshDay.year
      );
    });
    if (updatedDay) {
      updatedDays.push({
        expiresIn: updatedDay.expiresIn,
        data: { ...freshDay },
      });
    }
    if (!oldDay) {
      newDays.push({
        expiresIn: Date.now() + WEEK,
        data: { ...freshDay },
      });
    }
  });
  if (!updatedDays.length && !newDays.length) {
    return pluck('data', cachedDays);
  }
  const composedDays = cachedDays
    .filter(cachedDay => {
      return !updatedDays.find(updatedDay => {
        return (
          cachedDay.data.year === updatedDay.data.year &&
          cachedDay.data.month === updatedDay.data.month &&
          cachedDay.data.day === updatedDay.data.day
        );
      });
    })
    .concat(updatedDays, newDays)
    .sort((a, b) =>
      new Date(b.data.year, b.data.month, b.data.day) >
      new Date(a.data.year, a.data.month, a.data.day)
        ? 1
        : -1
    );
  await fastify.redis.set(
    DAYS_WITH_CHANGES_CACHE_KEY,
    JSON.stringify(composedDays)
  );
  return pluck('data', composedDays);
}

function applySearchOptions(options: RCEScheduleOptions) {
  return (day: DayWithChanges) => {
    const today = new Date();
    return (
      day.year === (options.year ? +options.year : today.getFullYear()) &&
      day.month === (options.month ? +options.month : today.getMonth() + 1) &&
      day.day === (options.day ? +options.day : today.getDate())
    );
  };
}

async function getUncachedRCEScheduleChanges(day: DayWithChanges) {
  const filename = createScheduleFilename(day);
  const response = await axios.get(`${RCE_ASSETS_PAGE}/${filename}`, {
    responseType: 'arraybuffer',
  });
  const pdf = await PdfParse(response.data, { version: 'v2.0.550' });
  return parseRCESchedule(pdf.text);
}

export async function getRCEScheduleChanges(
  fastify: FastifyInstance,
  options: RCEScheduleOptions
): Promise<ErrorProne<Schedule[]>> {
  const daysWithChanges = await getRCEDaysWithChanges(fastify);
  const day = daysWithChanges.find(applySearchOptions(options));
  if (!day) {
    return {
      error: 'Not found',
      message:
        'Requested schedule with specified parameters does not exist. Try calling /days-with-changes to find available.',
    };
  }
  let schedule: Schedule[];
  const scheduleCacheKey = createScheduleCacheKey(day);
  const cachedScheduleData = await fastify.redis.get(scheduleCacheKey);
  const cachedSchedule = cachedScheduleData
    ? safeJSONParse<CachedSchedule>(cachedScheduleData)
    : null;

  if (cachedSchedule && cachedSchedule.version === day.version) {
    schedule = cachedSchedule.data;
  } else {
    schedule = await getUncachedRCEScheduleChanges(day);
    const updatedCache: CachedSchedule = {
      data: schedule,
      version: day.version,
    };
    await fastify.redis.set(scheduleCacheKey, JSON.stringify(updatedCache));
  }

  return {
    error: null,
    data: schedule,
  };
}
