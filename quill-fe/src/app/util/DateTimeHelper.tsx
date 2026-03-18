import { DateTime, DateTimeFormatOptions } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, ForwardRefRenderFunction, } from "react";
import { Draggable, DraggableParams, DraggableRenderMethod, Droppable, DroppableRenderMethod } from "./Draggable";
import { 
    DATE_CLASS,
    TIME_CLASS, 
    ROWS_CLASS,
    ICONS,
    ICON_CLASS,
    BUTTON_OR_ICON_MEDIUM,
    ALIGNED_CLASS,
    CENTERED_CLASS,
    ROWS_OR_COLS_WITH_GAP_CLASS,
    POPUP_SMALL_CLASS,
 } from "./constants";
import { useTaskStore } from "../home/_globalStore/StoreProvider";
import { 
    DATE_DRAGDROP_TYPE, 
    DATE_FIELD_DRAGDROP_TYPE, 
    DateDragData, 
    DateDropData, 
    DEFAULT_DATE_DRAG_DATA, 
    defaultChangeTaskFieldToEndOrStartOfDay, 
    TASK_DRAGDROP_TYPE,
} from "./DraggableTypes";
import { combineClassNamePropAndString } from "./jsTools";

// Date and Time Constants
// Make sure you call these inside of a hook in a React component to avoid hydration errors!
export const END_OF_DAY = () => DateTime.now().endOf('day');
export const START_OF_DAY = () => DateTime.now().startOf('day');

const DRAGGED_DATE_CLASS = "dragged-date";

export const DraggedDatePresentation = observer(forwardRef<any, {
    date: DateTime<boolean> | null,
    includeTime?: boolean,
}>(({
    date,
    includeTime=false,
    ...props
}, ref) => {
    return <div 
        {...props}
        className={combineClassNamePropAndString(`
            ${DRAGGED_DATE_CLASS} 
            ${POPUP_SMALL_CLASS} 
            ${ROWS_CLASS}
            ${ROWS_OR_COLS_WITH_GAP_CLASS}
        `, props)}
        ref={ref}
    >
            <div className={`${ALIGNED_CLASS} ${CENTERED_CLASS} ${ICON_CLASS} ${BUTTON_OR_ICON_MEDIUM}`}>
                { ICONS.CALENDAR }
            </div>
            <div>
                <p className={`${DATE_CLASS}`}>
                    {`${date ? date.toLocaleString(DateTime.DATE_HUGE) : "unset date"}`}
                </p>
                {includeTime && <p className={`${TIME_CLASS}`}>
                    {`${date ? date.toLocaleString(DateTime.TIME_SIMPLE) : "unset date"}`}
                </p>}
            </div>
    </div>
}))

/**
 * Wrap around a draggable and droppable date component. 
 * Draggable to DATE FIELDs to set them to the given date and time. 
 * Droppable to TASKs so that tasks can change their due dates?
 */
export const DraggableDroppableDate = observer(forwardRef((
    {
        date,
        render,
        dragStart,
        dragEnd,
        draggedPresentation,
        itemData,
        actionTitle,
        droppable,
        useDragHandle,
        ...passedProps
    }
    : 
    {
        render: ForwardRefRenderFunction<any, any>
        date: DateTime<boolean>,
    } & Omit<DraggableParams<any>, "itemData">, 
    forwardedRef: ForwardedRef<any>) => {
    const taskStore = useTaskStore();

    return <DroppableRenderMethod <DateDropData>
            ref={forwardedRef}
            {...passedProps}
            collisionPriority={30}
            itemData={{
                type: DATE_DRAGDROP_TYPE,
                date: date,
                accepts: DEFAULT_DATE_DRAG_DATA.accepts,
                showDropPreview: true,
            }}
            callbacksForAcceptedDragTypes={{
                [DATE_FIELD_DRAGDROP_TYPE]: {
                    setDataWhenDragOver: ({drag, drop}) => {
                        const task = taskStore.getTaskById(drag.taskId);
                        task && defaultChangeTaskFieldToEndOrStartOfDay.set({task, drag, drop}); 
                    }, 
                    resetDataWhenDragOff({ drag, drop }) {
                        const task = taskStore.getTaskById(drag.taskId);
                        task && defaultChangeTaskFieldToEndOrStartOfDay.reset({task, drag, drop});
                    },
                    saveDataWhenDragEnds({ drag, drop}) {
                        const task = taskStore.getTaskById(drag.taskId);
                        task && defaultChangeTaskFieldToEndOrStartOfDay.save({task, drag, drop});
                    },
                }, 
            //     [TASK_DRAGDROP_TYPE]: {
            //         setDataWhenDragOver: ({drag, drop}) => {
            //             // If task dropped on date, get task from store given ID
            //             // aaannnddd change the task due? or start? date to date from drop 
            //             const taskId = drag.id;
            //             const task = taskStore.getTaskById(taskId);
            //             if (task && task.start && !task.due) {
            //                 task.startEditing();
            //                 task.start = drop.date;
            //             } else if (task) {
            //                 task.due = drop.date;
            //             }
            //         }, resetDataWhenDragOff({drag, drop}) {
            //             const taskId = drag.id;
            //             const task = taskStore.getTaskById(taskId);
            //             task && task.abortEdits();
            //         },
            //         saveDataWhenDragEnds({drag, drop}) {
            //             const taskId = drag.id;
            //             const task = taskStore.getTaskById(taskId);
            //             task && task.saveEdits();
            //         },
            // }
            }}
            render={(props, ref) => <DraggableRenderMethod <DateDragData>
                {...props}
                ref={ref}
                actionTitle={"Assign date"}
                itemData={{
                    showDropPreview: true,
                    type: DATE_DRAGDROP_TYPE,
                    date: date,
                }}
                droppable={true}
                useHandle={useDragHandle}
                draggedPresentation={(props, ref) => draggedPresentation ? 
                        draggedPresentation(props, ref) 
                        : <DraggedDatePresentation 
                            {...props}
                            ref={ref}
                            date={date}
                        />
                }
                render={render}
            />}        
        />
}))

export interface DateFormat {
    token?: DateTimeFormatOptions,
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

export const dateTimeHelper = (maybeDateTime: string | DateTime<boolean> | Date) => {
    var validatedDate;
    switch (typeof(maybeDateTime)) {
        case "string":
            validatedDate = stringToDateTimeHelper(maybeDateTime);
            break;
        case "object":
            if ( maybeDateTime instanceof DateTime) {
                validatedDate = maybeDateTime;
            } else if (maybeDateTime instanceof Date) {
                validatedDate = DateTime.fromJSDate(maybeDateTime as Date);
            }
            if (validatedDate && validatedDate.isValid) {
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