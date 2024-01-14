import { DateTime } from "luxon";

// Date and Time Constants
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');
export function DATE_TIME_FORMATS () {
    return {
        D: {
            token: "D",
            readable: "mm/dd/yyyy",
            serializer: function (dateTime) {
                return dateTime.toLocaleString(this.token); 
            },
            deserializer: function (string)
            {
                return DateTime.fromFormat(string, this.token);
            }
        },
        t: {
            token: "t",
            readable: "h:mm P",
            serializer: function (dateTime) { 
                return dateTime.toLocaleString(this.token); 
            },
            deserializer: function (string) {
                return DateTime.fromFormat(string, this.token);
            }
        },
        // Whole DateTime
        DateAndTime: {
            D_t: {
                token: `D t`,
                serializer: function (dateTime) { return dateTime.toLocaleString(this.token)},
                deserializer: function (string1, s2=null) { 
                    return DateTime.fromFormat(`${string1}${s2 === null ? "" : ` ${s2}`}`, this.token);
                },
            },
            ISO: {
                token: undefined,
                serializer: function (dateTime) { return dateTime.toISO(); },
                deserializer: function (string) { return DateTime.fromISO(string); },
            }
        }
    }
};

/**
 * Supports parsing dtString in supported formats into a Luxon DateTime object. Returns null if unable to parse
 * @param {*} dtString DateTime String in ISO or "D t" formats
 */
export const stringToDateTimeHelper = (dtString) => 
    {
        var date = DateTime.invalid("Invalid DateTime string", "Please provide a valid string");
        if (dtString.trim() === "") {
            return date;
        }
        var formatter;
        for (let formatKey in DATE_TIME_FORMATS().DateAndTime) {
            console.log(formatKey);
            formatter = DATE_TIME_FORMATS().DateAndTime[formatKey];
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