import { DateTime } from "luxon";
import pluralize from 'pluralize';

// Date and Time Constants
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');
export const DATE_TIME_FORMATS = {
    // Parts
    D: {
        token: "D",
        readable: "mm/dd/yyyy",
        serializer: (dateTime) => dateTime.DATE_SHORT,
        deserializer: (string) => DateTime.fromFormat(string, this.token),
     },
    t: {
        token: "t",
        readable: "h:mm P",
        serializer: (dateTime) => dateTime.TIME_SIMPLE,
        deserializer: (string) => DateTime.fromFormat(string, this.token),

     },
     // Whole DateTime
     DateAndTime: {
         D_t: {
             token: `D t`,
             serializer: (dateTime) => dateTime.toLocaleString(this.token),
             deserializer: function (string1, s2=null) { 
                return DateTime.fromFormat(`${string1}${s2 === null ? "" : ` ${s2}`}`, this.token);
            },
         },
         ISO: {
             token: undefined,
             serializer: (dateTime) => dateTime.toISO(),
             deserializer: (string) => DateTime.fromISO(string),
         }
    }
};

/**
 * Supports parsing dtString in supported formats into a Luxon DateTime object. Returns null if unable to parse
 * @param {*} dtString DateTime String in ISO or "D t" formats
 */
export const stringToDateTimeHelper = (dtString) => 
    {
        var date = DateTime.invalid("Invalid string", "Please provide a valid string");

        var formatter;
        for (let formatKey in DATE_TIME_FORMATS.DateAndTime) {
            console.log(formatKey);
            formatter = DATE_TIME_FORMATS.DateAndTime[formatKey];
            date = formatter.deserializer(dtString);
            if (!date.invalid) {
                break;
            }
        };
        return date;
    };

export const dateTimeHelper = (maybeDateTime) => {
    var validatedDate;
    switch (typeof(maybeDateTime)) {
        case "string":
            validatedDate = stringToDateTimeHelper(maybeDateTime);
            break;
        case "datetime":
            validatedDate = new DateTime(maybeDateTime);
            break;
        default:
            validatedDate = DateTime.invalid("Invalid string or DateTime", "Please provide a valid string or DateTime");
    }
    return validatedDate;
}

export const DEFAULT_DUE_DATETIME = END_OF_DAY();
export const DEFAULT_DUE_DATE_STRING = DATE_TIME_FORMATS.D.serializer(DEFAULT_DUE_DATETIME);
export const DEFAULT_DUE_TIME_SRING =  DATE_TIME_FORMATS.t.serializer(DEFAULT_DUE_DATETIME);

// Task creation
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const taskCreationErrors = {
    NO_TITLE: `Please enter a title`,
    TITLE_TOO_LONG: (title) => `Title is ${pluralize(`character`, title.length-MAX_TITLE_LENGTH, true)} too long`,
    DESCRIPTION_TOO_LONG: (description) => `Description is ${pluralize(`character`, description.length-MAX_DESCRIPTION_LENGTH, true)} too long`,
    START_TIME_AFTER_DUE: `Due time must be after start time`,
    START_DATE_AFTER_DUE: `Due date must be on or after start date`,
    INVALID_TIME_FORMAT: `Time is not of the format ${DATE_TIME_FORMATS.t.readable}. Ex: 10:30 am`,
    INVALID_DATE_FORMAT: `Date is not of the format ${DATE_TIME_FORMATS.D.readable}. Ex: 7/26/2022`,
}

// URLs
export const API_URL = "http://localhost:8000/api/tasks/";