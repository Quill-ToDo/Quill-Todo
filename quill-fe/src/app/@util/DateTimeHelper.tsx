import { DateTime, DateTimeFormatOptions } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentPropsWithoutRef, forwardRef, ForwardRefRenderFunction, ReactNode, useState } from "react";
import { Draggable, Droppable } from "./Draggable";
import { TASK_DRAG_TYPE } from "../home/_globalStore/tasks/TaskModel";
import { POPUP_CLASS } from "./Popup";
import { DATE_CLASS, PADDING_CLASS, ROUND_CORNERS_CLASS, SUBTLE_CLASS } from "./constants";

// Date and Time Constants
// Make sure you call these inside of a hook in a React component to avoid hydration errors!
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');

const DRAGGED_DATE_CLASS = "dragged-date";
export const DATE_DRAG_TYPE = "date";
export const DATE_FIELD_DRAG_TYPE = "date field";
/**
 * Wrap around a draggable and droppable date component. 
 * Draggable to DATE FIELDs to set them to the given date and time. 
 * Droppable to TASKs so that tasks can change their due dates?
 */
export const DraggableDroppableDate = observer(forwardRef((
    {
        useDragHandle,
        date,
        renderChild,
        ...props
    }
    : 
    {
        useDragHandle: boolean,
        date: DateTime<boolean>
        renderChild: ForwardRefRenderFunction<any, any>,
        props?: ComponentPropsWithoutRef<any>
    }, ref) => {

        // Why do the others disappear when I drag this
    return <Draggable 
        droppable={true}
        itemType={DATE_DRAG_TYPE}
        itemData={{
            date: date
        }}
        useHandle={useDragHandle}
        actionTitle="Assign date"
        dragStart={(e) => {
            console.log("Start")
        }}
        dragEnd={(e, callback) => {
            console.log(e.active);
            // on drag end, 
            // if dragged to task field type, set the task field to the date passed 
            // callback()
        }}
        draggedPresentation={<div className={`${DRAGGED_DATE_CLASS} ${POPUP_CLASS} ${ROUND_CORNERS_CLASS}`}>
            <header><p>date:</p></header>
            <div className={PADDING_CLASS}>
                <p className={`${DATE_CLASS}`}>
                    {`${date.toLocaleString(DateTime.DATE_HUGE)}`}
                </p>
            </div>
        </div>
        }
    >
        {/* <Droppable
            acceptedItemTypes={[TASK_DRAG_TYPE]}
            onDrop={({drop, drag}) => {
                // If date field, get the task ID from drag
                // get task from store given ID
                // change the task due date to passed date 
            }}
        > */}
            {renderChild( 
                {
                    ...props,
                }, ref
            )}
        {/* </Droppable> */}
    </Draggable>
}))

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