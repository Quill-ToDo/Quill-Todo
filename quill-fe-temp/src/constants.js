import { DateTime } from "luxon";
import pluralize from 'pluralize';


// Date and Time Constants
export const END_OF_DAY = () => DateTime.now().endOf("day");
export const START_OF_DAY = () => DateTime.now().startOf("day");
export const DATE_FORMAT = "D";
export const HUMAN_READABLE_DATE_FORMAT = "mm/dd/yyyy";
export const TIME_FORMAT = "t";
export const HUMAN_READABLE_TIME_FORMAT = "h:mm P"
export const DATE_TIME_FORMAT = DATE_FORMAT + " " + TIME_FORMAT;
export const DEFAULT_DUE_DATE = END_OF_DAY().toFormat(DATE_FORMAT);
export const DEFAULT_DUE_TIME = END_OF_DAY().toFormat(TIME_FORMAT);

// Task creation
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const taskCreationErrors = {
    NO_TITLE: "Please enter a title",
    TITLE_TOO_LONG: (title) => `Title is ${pluralize("character", title.length-MAX_TITLE_LENGTH, true)} too long`,
    DESCRIPTION_TOO_LONG: (description) => `Description is ${pluralize("character", description.length-MAX_DESCRIPTION_LENGTH, true)} too long`,
    START_TIME_AFTER_DUE: 'Due time must be after start time',
    START_DATE_AFTER_DUE: 'Due date must be on or after start date',
    INVALID_TIME_FORMAT: `Time is not of the format ${HUMAN_READABLE_TIME_FORMAT}. Ex: 10:30 am`,
    INVALID_DATE_FORMAT: `Date is not of the format ${HUMAN_READABLE_DATE_FORMAT}. Ex: 7/26/2022`,
}

// URLs
export const API_URL = "http://localhost:8000/api/tasks/";