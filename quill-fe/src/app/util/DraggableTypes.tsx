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
    showDropPreview: boolean,
} 
export interface RequiredDropData {
    type: string,
    accepts: string[],
};
//#region Names and Data Types 
export const DATE_DRAGDROP_TYPE = "date";
export type DateDragData = {
    date: DateTime<boolean>,
} & RequiredDragData;
export type DateDropData = DateDragData & RequiredDropData;
export const DATE_FIELD_DRAGDROP_TYPE = "date field";
export type DateFieldDragData = {
    date: DateTime<boolean>,
    fieldType: "due" | "start",
    taskId: string,
} & RequiredDragData;
export type DateFieldDropData = DateFieldDragData & RequiredDropData;
export const DELETE_DRAGDROP_TYPE = "delete";
export type DeleteDragData = RequiredDragData;
export type DeleteDropData = RequiredDropData;
export const TASK_DRAGDROP_TYPE = "task";
export type TaskDragData = {
    id: string,
} & RequiredDragData;
export type TaskDropData = TaskDragData & RequiredDropData;
//#region Type name to data type
export type DragStringTypesToDragDataType = {
    [DATE_DRAGDROP_TYPE]: DateDragData,
    [DATE_FIELD_DRAGDROP_TYPE]: DateFieldDragData,
    [DELETE_DRAGDROP_TYPE]: DeleteDragData,
    [TASK_DRAGDROP_TYPE]: TaskDragData,
};
export type DropStringTypeToDropDataType = {
    [DATE_DRAGDROP_TYPE]: DateDropData,
    [DATE_FIELD_DRAGDROP_TYPE]: DateFieldDropData,
    [DELETE_DRAGDROP_TYPE]: DeleteDropData,
    [TASK_DRAGDROP_TYPE]: TaskDropData,
};
//#endregion Type name to data type
//#endregion Names and Data Types 

export interface DragDropConstants {
    type: string,
    accepts: string[],
}
//#region Default data
export const DEFAULT_DATE_DRAG_DATA: DragDropConstants = {
    type: DATE_DRAGDROP_TYPE,
    accepts: [DATE_FIELD_DRAGDROP_TYPE],
};
export const DEFAULT_DATE_FIELD_DRAG_DATA: DragDropConstants = {
    type: DATE_FIELD_DRAGDROP_TYPE,
    accepts: [DATE_DRAGDROP_TYPE, DELETE_DRAGDROP_TYPE, DATE_FIELD_DRAGDROP_TYPE],
};
export const DEFAULT_DELETE_DRAG_DATA: DragDropConstants = {
    type: DELETE_DRAGDROP_TYPE,
    accepts: [TASK_DRAGDROP_TYPE, DATE_FIELD_DRAGDROP_TYPE],
};
export const DEFAULT_TASK_DRAG_DATA: DragDropConstants = {
    type: TASK_DRAGDROP_TYPE,
    accepts: [DELETE_DRAGDROP_TYPE],
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

type DragDropInteraction<Props> = {
    set: (props: Props) => void | null, 
    reset: (props: Props) => void | null, 
    save: (props: Props) => void | null, 
}  

// Dragging task
// Task x Delete
export const defaultTaskDeleteInteraction: DragDropInteraction<{
    task: TaskModel, 
    openDeleteConfirmPopup: Function, 
    drag: TaskDragData|DeleteDragData, 
    drop: DeleteDropData|TaskDropData,
}> = {
    // Dragging delete to task or vice vera should open Delete confirmation popup for task
    save: ({task, openDeleteConfirmPopup, drag, drop},) => {
        if ((drag && drag.type === TASK_DRAGDROP_TYPE && (drag as TaskDragData).id === task.id) 
            || (drop && drop.type === TASK_DRAGDROP_TYPE && (drop as TaskDropData).id === task.id)) {
            // Dragging task to trash opens task deletion confirmation popup
            if ((drop && drop.type === DELETE_DRAGDROP_TYPE) || drag && drag.type === DELETE_DRAGDROP_TYPE) {
                // Does this element have the same ID as anchorElementId
                openDeleteConfirmPopup(() => task);
            }
        } 
    },
    reset({task}) {
        task.store && task.store.loadTasks();
    },
    set({task}) {
        task.store && task.store.remove(task);
    },
}
// Date Field x Date field
export const defaultChangeTaskFieldToDate: DragDropInteraction<{
    task: TaskModel,
    drag: DateFieldDragData,
    drop: DateFieldDropData, 
}> = {
    // Dragging date field to another date field sets the dropped date container to the value of dragged date 
    set: ({task, drag, drop}) => {
        if (drag && drop) {
            const { date } = drag;
            const { fieldType } = drop;
            task.startEditing();
            if (fieldType === "start") {
                task.start = date;  
            } else {
                task.due = date;
            }
        }
    }, 
    reset: ({task, drag}) => {
        // if (revertVal !== dateField && (!drop || drop.taskId !== task.id) ) {
        //                     // If date is not over the droppable area, revert to the starting date time
        //                     resetDate()
        //                 }
        if (drag) {
            // resetTaskFieldToPreviousValue(task, drag.fieldType, prev)
            task && task.abortEdits();
        }
    },
    save: ({task}) => {
        task.saveEdits();
    }
}
// Drag Date to Date Field
export const defaultChangeTaskFieldToEndOrStartOfDay: DragDropInteraction<
    {
        task: TaskModel,
        drag: DateDragData | DateFieldDragData, 
        drop: DateFieldDropData | DateDropData,
    }
    > = {
        set: ({task, drag, drop}) => {
            // Dragging a date to a task date field or vice versa sets the field to the passed date
            if (drag && drop) {
                const date: DateDragData = drag.type === DATE_DRAGDROP_TYPE ? drag : drop;
                const taskField: DateFieldDropData = drag.type === DATE_FIELD_DRAGDROP_TYPE ? 
                    drag.fieldType
                    : drop.fieldType;
                const { fieldType } = taskField;
                task.startEditing();
                if (fieldType === "start") {
                    // If date is passed to start date, make it the beginning of the day
                    task.start = date.date.set({hour: 0, minute: 0, second: 0});  
                } else {
                    // If date is passed to due date, make it the end of the day
                    task.due = date.date.set({hour: 23, minute: 59, second: 59});
                }
            }
        },
        reset: ({task}) => {
            task.abortEdits();
        },
        save: ({task}) => {
            task.saveEdits();
        } 
}

export const defaultTaskDateClearInteraction: DragDropInteraction<{
    task: TaskModel,
    drag: DeleteDragData, 
    drop: DateFieldDropData
}> = {
        set: ({task, drop}) => {
            // Dragging trash onto a task date field clears it
            if (drop) {
                task.startEditing();
                const { fieldType } = drop;
                if (fieldType === "start") {
                    task.start = null;  
                } else {
                    task.due = null;
                }
            }
        }, 
        reset: ({task}) => {
            // Reset turns the task field to whatever datetime it was before
            task.abortEdits();
        },
        save: ({task}) => {
            task.saveEdits();
        } 
}
