import { DateTime } from "luxon";
import { TaskModel, TaskDateFields } from "../home/_globalStore/tasks/TaskModel";

// Types to be assigned to Draggable and Droppable components as types.
// You don't have to follow this pattern strictly but:

// 1. Add a drag type name like <name>_DRAG_TYPE so that
//    all the drag types below can reference each other using these names.
// 2. Add drag and or drop data Type(s) to pass to Droppable and Draggable components 
//    which extend RequiredDragData (for dragged data) or RequiredDropData (for dropped data)
// 3. Add the mapping of the type string name to the drag and drop data types you made for it in DragTypesToDragDataTypes
// 4. Add default data to re-use following the Type restraints of DragDropConstants
export interface RequiredDragData {
    type: string,
    showDropPreview?: boolean,
} 
export interface RequiredDropData {
    type: string,
    accepts: string[],
};
//#region Names and Data Types 
export const DATE_DRAG_TYPE = "date";
export type DateDragData = {
    date: DateTime<boolean>,
} & RequiredDragData;
export type DateDropData = DateDragData & RequiredDropData;
export const DATE_FIELD_DRAG_TYPE = "date field";
export type DateFieldDragData = {
    date: DateTime<boolean>,
    fieldType: "due" | "start",
    taskId: string,
} & RequiredDragData;
export type DateFieldDropData = DateFieldDragData & RequiredDropData;
export const DELETE_DRAG_TYPE = "delete";
export type DeleteDragData = RequiredDragData;
export type DeleteDropData = RequiredDropData;
export const TASK_DRAG_TYPE = "task";
export type TaskDragData = {
    id: string,
} & RequiredDragData;
export type TaskDropData = TaskDragData & RequiredDropData;
//#region Type name to data type
export type DragTypesToDragDataTypes = {
    [DATE_DRAG_TYPE]: DateDragData,
    [DATE_FIELD_DRAG_TYPE]: DateFieldDragData,
    [DELETE_DRAG_TYPE]: DeleteDragData,
    [TASK_DRAG_TYPE]: TaskDragData,
};
//#endregion Type name to data type
//#endregion Names and Data Types 

export interface DragDropConstants {
    type: string,
    accepts: string[],
}
//#region Default data
export const DEFAULT_DATE_DRAG_DATA: DragDropConstants = {
    type: DATE_DRAG_TYPE,
    accepts: [DATE_FIELD_DRAG_TYPE],
};
export const DEFAULT_DATE_FIELD_DRAG_DATA: DragDropConstants = {
    type: DATE_FIELD_DRAG_TYPE,
    accepts: [DATE_DRAG_TYPE, DELETE_DRAG_TYPE, DATE_FIELD_DRAG_TYPE],
};
export const DEFAULT_DELETE_DRAG_DATA: DragDropConstants = {
    type: DELETE_DRAG_TYPE,
    accepts: [TASK_DRAG_TYPE, DATE_FIELD_DRAG_TYPE],
};
export const DEFAULT_TASK_DRAG_DATA: DragDropConstants = {
    type: TASK_DRAG_TYPE,
    accepts: [DELETE_DRAG_TYPE],
};
//#endregion Types 
const resetTaskFieldToPreviousValue = ({
    prevDate, 
    task, 
    fieldType
}: {
    prevDate: DateTime<boolean>, 
    task: TaskModel, 
    fieldType: TaskDateFields
}) => {
    if (fieldType === "start") {
        task.start = prevDate;  
    } else {
        task.due = prevDate;
    }
}

type DragDropInteraction<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
    set?: (drag: DragData, drop: DropData, props: any) => void | null, 
    reset?: (drag: DragData, drop: DropData, props: any) => void | null, 
    save?: (drag: DragData, drop: DropData, props: any) => void | null, 
}  

// Dragging task
// Task x Delete
export const defaultTaskDeleteInteraction: DragDropInteraction<TaskDragData|DeleteDragData, DeleteDropData|TaskDropData> = {
    // Dragging delete to task or vice vera should open Delete confirmation popup for task
    save: (drag, drop, {task, openDeleteConfirmPopup}: {task: TaskModel, openDeleteConfirmPopup: Function}) => {
        if ((drag && drag.type === TASK_DRAG_TYPE && (drag as TaskDragData).id === task.id) 
            || (drop && drop.type === TASK_DRAG_TYPE && (drop as TaskDropData).id === task.id)) {
            // Dragging task to trash opens task deletion confirmation popup
            if ((drop && drop.type === DELETE_DRAG_TYPE) || drag && drag.type === DELETE_DRAG_TYPE) {
                // Does this element have the same ID as anchorElementId
                openDeleteConfirmPopup(() => task);
            }
        } 
    }
}
// Date Field x Date field
export const defaultChangeTaskFieldToDate: DragDropInteraction<DateFieldDragData, DateFieldDropData> = {
    // Dragging date field to another date field sets the dropped date container to the value of dragged date 
    set: (drag, drop, {task}: {task: TaskModel}) => {
        if (drag && drop) {
            const { date } = drag;
            const { fieldType } = drop;
            if (fieldType === "start") {
                task.start = date;  
            } else {
                task.due = date;
            }
        }
    }, 
    reset: (drag, drop, {task, revertVal}) => {
        // if (revertVal !== dateField && (!drop || drop.taskId !== task.id) ) {
        //                     // If date is not over the droppable area, revert to the starting date time
        //                     resetDate()
        //                 }
        // if (drag) {
        //     // resetTaskFieldToPreviousValue(task, drag.fieldType, prev)
        //     task && task.abortEdits();
        // }
    },
}
// Drag Date to Date Field
export const defaultChangeTaskFieldToEndOrStartOfDay: DragDropInteraction<DateDragData | DateFieldDragData, DateFieldDropData | DateDropData> = {
        set: (drag, drop, {task}: {task: TaskModel}) => {
            // Dragging a date to a task date field or vice versa sets the field to the passed date
            if (drag && drop) {
                const date: DateDragData = drag.type === DATE_DRAG_TYPE ? drag : drop;
                const dateField: DateFieldDropData = drop.type === DATE_FIELD_DRAG_TYPE ? drop : drag;
                const { fieldType } = dateField;
                if (fieldType === "start") {
                    // If date is passed to start date, make it the beginning of the day
                    task.start = date.date.set({hour: 0, minute: 0, second: 0});  
                } else {
                    // If date is passed to due date, make it the end of the day
                    task.due = date.date.set({hour: 23, minute: 59, second: 59});
                }
            }
        }, 
}

export const defaultTaskDateClearInteraction: DragDropInteraction<DeleteDragData, DateFieldDropData> = {
        set: (drag, drop, {task}: {task: TaskModel}) => {
            // Dragging trash onto a task date field clears it
            if (drop) {
                const { fieldType } = drop;
                if (fieldType === "start") {
                    task.start = null;  
                } else {
                    task.due = null;
                }
            }
        }, 
        // Reset turns the task field to whatever datetime it was before
}
