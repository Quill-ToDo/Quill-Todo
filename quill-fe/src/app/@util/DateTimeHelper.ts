import { DateTime, DateTimeFormatOptions } from "luxon";

// Date and Time Constants
// Make sure you call these inside of a hook in a React component to avoid hydration errors!
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');


export interface DateFormat {
    token: DateTimeFormatOptions,
    serializer: (dateTime: DateTime<boolean>) => string,
    deserializer: (string: string, s2?: string) => DateTime<boolean>,
}

type DateXOrTimeFormat = DateFormat & {
    readable: string;
    deserializer: (string: string) => DateTime<boolean>,
}

export const PARTIAL_DATETIME_FORMATS: {
    D: DateXOrTimeFormat, 
    t: DateXOrTimeFormat, 
    [index : string] : DateXOrTimeFormat } = {
    D: {
        token: DateTime.DATE_SHORT,
        readable: "M/d/yyyy",
        serializer: function (dateTime) {
            return dateTime.toLocaleString(this.token); 
        },
        deserializer: function (string)
        {
            return DateTime.fromFormat(string, "D");
        }
    },
    t: {
        token: DateTime.TIME_SIMPLE,
        readable: "h:mm P",
        serializer: function (dateTime) { 
            return dateTime.toLocaleString(this.token); 
        },
        deserializer: function (string) {
            return DateTime.fromFormat(string, "t");
        }
    },
}
export const DATETIME_FORMATS: {D_t: DateFormat, ISO: DateFormat, [index : string] : DateFormat } = {
    // https://moment.github.io/luxon/#/parsing?id=table-of-tokens
    D_t: {
        token: DateTime.DATETIME_SHORT,
        serializer: function (dateTime) { return dateTime.toLocaleString(this.token)},
        deserializer: function (string: string, s2?: string) { 
            return DateTime.fromFormat(`${string}${s2 === undefined ? "" : `, ${s2}`}`, "f");
        },
    },
    ISO: {
        token: DateTime.ISO,
        serializer: function (dateTime) {
            const val = dateTime.toISO(); 
            return val === null ? "" : val;
        },
        deserializer: function (string: string) { return DateTime.fromISO(string); },
    }
};

/**
 * Supports parsing dtString in supported formats into a Luxon DateTime object. Returns null if unable to parse
 * @param {*} dtString DateTime String in ISO or "D t" formats
 */
export const stringToDateTimeHelper = (dtString: string) => 
    {
        var parsed = new Date(dtString); 
        return DateTime.fromMillis(parsed.valueOf());
    };

export const dateTimeHelper = (maybeDateTime: string | DateTime<boolean>) => {
    var validatedDate;
    switch (typeof(maybeDateTime)) {
        case "string":
            validatedDate = stringToDateTimeHelper(maybeDateTime);
            break;
        case "object":
            if (maybeDateTime.isLuxonDateTime) {
                validatedDate = maybeDateTime;
            } else {
                validatedDate = DateTime.fromObject(maybeDateTime);
            }
            if (validatedDate.isValid) {
                break;
            }
        default:
            validatedDate = DateTime.invalid("Invalid string or DateTime", "Please provide a valid string or DateTime");
            break;
    }
    return validatedDate;
}

    /**
     * @param time The DT to check.
     * @returns true if the time occurs before the end of the current day, false otherwise.
     */
    export const timeOccursBeforeEOD = (time: DateTime) => {
        return (time <= END_OF_DAY())
    }

    /**
     * 
     * @param time The DT to check.
     * @returns true if time occurs between now and the end of the current day, false otherwise.
     */
    export const timeOccursBetweenNowAndEOD = (time: DateTime) => {
        return (timeOccursBeforeEOD(time) && (DateTime.now() < time))
    }