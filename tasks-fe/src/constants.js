import { DateTime } from "luxon";

export const END_OF_DAY = DateTime.now().set({hour:23, minute:59, second:59, millisecond: 999})

export const DATE_FORMAT = "D";
export const TIME_FORMAT = "t";
export const DATE_TIME_FORMAT = DATE_FORMAT + " " + TIME_FORMAT;
export const DEFAULT_DUE_DATE = END_OF_DAY.toFormat(DATE_FORMAT);
export const DEFAULT_DUE_TIME = END_OF_DAY.toFormat(TIME_FORMAT);

export const API_URL = "http://localhost:8000/api/tasks/";