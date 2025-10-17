import { DateTime } from "luxon";

// Types to be assigned to Draggable and Droppable components as types.
// You don't have to follow this pattern strictly but:

// 1. Add a drag type name like <name>_DRAG_TYPE at the top of this file so that
//    all the drag types below can reference each other using these names.
//#region Names
export const DATE_DRAG_TYPE = "date";
export const DATE_FIELD_DRAG_TYPE = "date field";
export const DELETE_DRAG_TYPE = "delete";
export const TASK_DRAG_TYPE = "task";
//# endregion Names

// 2. Add drag and or drop Type(s) to pass to Droppable and Draggable components which extend RequiredDragData
//    or RequiredDropData
export interface RequiredDragData {
    type: string,
} 
export interface RequiredDropData {
    type: string,
    accepts: string[],
};
//#region Types
// Date
export type DateDragData = {
    date: DateTime<boolean>,
} & RequiredDragData;
export type DateDropData = DateDragData & RequiredDropData;
// Date Field
export type DateFieldDragData = {
    date: DateTime<boolean>,
    fieldType: "due" | "start",
    taskId: string,
} & RequiredDragData;
export type DateFieldDropData = DateFieldDragData & RequiredDropData;
// Delete
export type DeleteDragData = RequiredDragData;
export type DeleteDropData = RequiredDropData;
// Task
export type TaskDragData = {
    id: string,
} & RequiredDragData;
export type TaskDropData = TaskDragData & RequiredDropData;
//#endregion Types

// 3. Add default data to re-use following the Type restraints of DragDropConstants
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
    accepts: [DATE_DRAG_TYPE, DELETE_DRAG_TYPE],
};
export const DEFAULT_DELETE_DRAG_DATA: DragDropConstants = {
    type: DELETE_DRAG_TYPE,
    accepts: [TASK_DRAG_TYPE, DATE_FIELD_DRAG_TYPE],
};
export const DEFAULT_TASK_DRAG_DATA: DragDropConstants = {
    type: TASK_DRAG_TYPE,
    accepts: [DELETE_DRAG_TYPE],
} ;
//#endregion Types 
