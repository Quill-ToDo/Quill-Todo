import { DateTime } from "luxon";

// Date and Time Constants
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');
export function DATE_TIME_FORMATS () {
    // https://moment.github.io/luxon/#/parsing?id=table-of-tokens
    return {
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
        // Whole DateTime
        DateAndTime: {
            D_t: {
                token: DateTime.DATETIME_SHORT,
                serializer: function (dateTime) { return dateTime.toLocaleString(this.token)},
                deserializer: function (string1, s2=null) { 
                    return DateTime.fromFormat(`${string1}${s2 === null ? "" : `, ${s2}`}`, "f");
                },
            },
            ISO: {
                token: DateTime.ISO,
                serializer: function (dateTime) { return dateTime.toISO(); },
                deserializer: function (string, s2=null) { return DateTime.fromISO(string); },
            }
        }
    }
};

/**
 * Supports parsing dtString in supported formats into a Luxon DateTime object. Returns null if unable to parse
 * @param {*} dtString DateTime String in ISO or "D t" formats
 */
export const stringToDateTimeHelper = (dtString, timeString=null) => 
    {
        var date = DateTime.invalid("Invalid DateTime string", "Please provide a valid string");
        if (dtString.trim() === "") {
            return date;
        }
        var formatter;
        for (let formatKey in DATE_TIME_FORMATS().DateAndTime) {
            formatter = DATE_TIME_FORMATS().DateAndTime[formatKey];
            date = formatter.deserializer(dtString, timeString);
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
        case "object":
            if (maybeDateTime.isLuxonDateTime) {
                validatedDate = maybeDateTime;
                break;
            }
        default:
            validatedDate = DateTime.invalid("Invalid string or DateTime", "Please provide a valid string or DateTime");
            break;
    }
    return validatedDate;
}

    /**
     * @param {DateTime} time The DT to check.
     * @returns true if the time occurs before the end of the current day, false otherwise.
     */
    export const timeOccursBeforeEOD = (time) => {
        return (time <= END_OF_DAY())
    }

    /**
     * 
     * @param {DateTime} time The DT to check.
     * @param {*} currentTime The current time. (now)
     * @returns true if time occurs between now and the end of the current day, false otherwise.
     */
    export const timeOccursBetweenNowAndEOD = (time) => {
        return (timeOccursBeforeEOD(time) && (DateTime.now() < time))
    }