import { makeAutoObservable } from "mobx"
import {  
    stringToDateTimeHelper,
    DATE_TIME_FORMATS,
} from "@/utilities/DateTimeHelper";
import TaskModel from "@/store/tasks/TaskModel";
import { addAlert, ERROR_ALERT } from "@/alerts/alertEvent";
import { DateTime } from "@eonasdan/tempus-dominus";

const VALIDATION_ERROR_MESSAGES = {
    INVALID_TIME_FORMAT: `Time is not of the format ${DATE_TIME_FORMATS().t.readable}. Ex: 10:30 am`,
    INVALID_DATE_FORMAT: `Date is not of the format ${DATE_TIME_FORMATS().D.readable}. Ex: 7/26/2022`,
    INVALID_DATETIME_FORMAT: `Date and time could not be parsed together.`,
}

/**
 * A Model to add fields and methods needed to edit a task. 
 *  - Use setters to change values, even internally. 
 *  - Fields must have defaults set in CLASS FIELDS region to be observable. 
 *  - Use setter methods as defined in CLASS FIELD GETTERS AND SETTERS region
 *    to change fields, even internally in this file. They may have side-effects... 
 *  - Define Getters, setters, and validation errors for each class field in 
 *    the appropriate region or method.
 *      - Getters and setters in CLASS FIELD GETTERS AND SETTERS region
 *      - Validation errors in `get ValidationErrors()`. Name the class field key
 *        for each array of errors after its field name as defined here.
 *  - Must implement `get isValid()` which returns True if no fields defined in this class
 *    ?? Or its parent class?? have any validation errors and this task may be saved 
 *    to the database.  
 */
export default class EditTaskModel {
//#region CLASS FIELDS AND CONSTRUCTOR
    // "name" : Type : Description
    // ----------------------------------------------------
    // ---- Public ----
        // get "task" : The base TaskModel being edited, what this class inherits data from..
            task : TaskModel;
        // get / set "startTimeString" : The text of the start time string 
            // as the user edits this task. Does not need to be a valid time string to be
            // set as this task is "in-progress" 
            startTimeStringBeingEdited : String = "";
        // get / set "startDateString" : The text of the start date string 
            // as the user edits this task. Does not need to be a valid date string to be
            // set as this task is "in-progress" 
            startDateStringBeingEdited : String = "";
        // get / set "dueTimeString" : The text of the due time string 
            // as the user edits this task. Does not need to be a valid time string to be
            // set as this task is "in-progress" 
            dueTimeStringBeingEdited : String = "";
        // get / set "dueDateString" : The text of the due date string 
            // as the user edits this task. Does not need to be a valid date string to be
            // set as this task is "in-progress" 
            dueDateStringBeingEdited : String = "";
        // get "validationErrors" : List<Objects> : A list of validation errors of this edited task.
        // get "isValid" : Boolean : The fields in this task are parseable and it is safe to 
            // update the parent TaskModel
        // "" : EditTaskModel : 
        // static taskBeingEdited = null;

    // ---- Private ----
    // ----------------------------------------------------
    /**
     * An object to represent a task being edited. This extends TaskModel. It is used to show additional 
     * fields in a news task pop-up that may change the underlying TaskModels data. These changes are
     * not synced to the DB.
     * 
     * **Important:** Use setter methods to change any values, even internally. 
     * They may have side-effects.
     * 
     * @param {TaskModel} task The base TaskModel to edit
     */
    constructor(task : TaskModel) {
        makeAutoObservable(this, {
            task: true,
            startTimeString: true,
            startDateString: true,
            dueTimeString: true, 
            dueDateString: true,
        }, {proxy: false});
        // Initialize all class fields not using setters
        this.task = task;
        this.startDateStringBeingEdited = this.task.startDateString;
        this.startTimeStringBeingEdited = this.task.startTimeString;
        this.dueDateStringBeingEdited = this.task.dueDateString;
        this.dueTimeStringBeingEdited = this.task.dueTimeString;
        this.startEditing();
    }
//#endregion
//#region LOGICAL METHODS
    /**
     * Set the task passed as "being edited". Only one task can be 
     * in this state at a time. Updates to the trask model will not 
     * be saved to the DB, but changes will be synchronized in the UI 
     * through the TaskStore. 
     * To sync changes to DB, call `this.finishEditing` or abort 
     * changes with `this.abortEditing`.
     */
    startEditing() {
        // TODO figure out how to make this class handle this logic instead of modifying taskStore
        // EditTaskModel.setTaskBeingEdited(this);
        this.task.dontSaveToServer();
        this.task.store.setEditing(this);
    }
    /**
     * Mark a task being edited as "done" and save the task to the DB
     * if changes are valid.
     */
    finishEditing () {
        // Validate that there are no errors. If there are, raise an alert.
        if (this.isValid) {
            addAlert(document.querySelector('#new-wrapper'), 
            ERROR_ALERT, 
            `Task could not be saved, it still has errors - ${this.validationErrors}`);
            console.error(this.validationErrors);
            console.error(this);
            return;
        } 
        
        // Post to server
        this.task.store.API.createTask(this.task.Json)
        .catch(e => {
            console.error(e)
            addAlert(document.querySelector('#home-wrapper'), 
            ERROR_ALERT, 
            `Could not add task - ${e}`);            
            this.task.removeSelfFromStore();
        });

        this.task.store.setEditing(null);
        this.task.saveToServer();
    }
    /**
     * Abort any edit changes and delete task from the TaskStore.
     */
    abortEditing () {
        this.task.store.setEditing(null);
        if (!this.createdDate) {
            // TODO make sure this is removing
            this.task.removeSelfFromStore();
        }
        else {
            // TODO
        }
    }
//#endregion
//#region CLASS FIELD GETTERS AND SETTERS
//#region startDateString
    get startDateString () {
        return this.startDateStringBeingEdited;
    }
    setStartDateString = (dateString : String)  =>  { 
        this.startDateStringBeingEdited = dateString;
        if (this.validationErrors.startDateString.length === 0 && this.validationErrors.start.length === 0) {
            this.task.setStart(`${dateString} ${this.startTimeString}`);
        }
    }
//#endregion
//#region startTimeString
    get startTimeString () {
        return this.startDateStringBeingEdited;
    }
    /**
     * Set start time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If it is parseable, also update the start time of the task.
     * @param {String} timeString 
     */
    setStartTimeString = (timeString : String)  =>  { 
        this.startTimeStringBeingEdited = timeString;
        if (this.validationErrors.startTimeString.length === 0 && this.validationErrors.start.length === 0) {
            this.task.setStart(`${this.startDateString} ${timeString}`);
        }
    }
//#endregion
//#region dueDateString
    get dueDateString () {
        return this.dueDateStringBeingEdited;
    }
    /**
     * Set due date portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueDateString (dateString : String) {
        this.dueDateStringBeingEdited = dateString;
        if (this.validationErrors.dueDateString.length === 0 && this.validationErrors.due.length === 0) {
            this.task.setDue(`${dateString} ${this.dueTimeString}`);
        }
    }
//#endregion
//#region dueTimeString
    get dueTimeString () {
        return this.dueTimeStringBeingEdited;
    }
    /**
     * Set due time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueTimeString (timeString : String) { 
        this.dueTimeStringBeingEdited = timeString;
        if (this.validationErrors.dueTimeString.length === 0 && this.validationErrors.due.length === 0) {
            this.task.setDue(`${this.dueDateString} ${timeString}`);
        }
    }
//#endregion
//#region Inherited from TaskModel
    get title () { return this.task.title; };
    get description () { return this.task.description; };
    get complete () { return this.task.complete; }
    get createdDate () { return this.task.createdDate; }
    get start () { return this.task.start; }
    get due () { return this.task.due; }
    setTitle (string : string) { this.task.setTitle(string) };
    setDescription (string : string) { this.task.setDescription(string) };
    setComplete (bool : boolean) { this.task.setComplete(bool) };
    setStart (dateTime : DateTime) { this.task.setStart(dateTime) };
    setDue (dateTime : DateTime) { this.task.setDue(dateTime) };
    saveToServer () { this.task.saveToServer() };
//#endregion
//#endregion CLASS FIELD GETTERS AND SETTERS
//#region VALIDATION
    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     * 
     */
    get validationErrors() {
        // Object to save error messages in
        type ErrorObject = {
            [index : string] : string[];
            title: string[];
            description: string[];
            start: string[];
            startTimeString: string[];
            startDateString: string[];
            due: string[];
            dueTimeString: string[];
            dueDateString: string[];
        };

        const errors : ErrorObject = {
            title: this.task.validationErrors.title,
            description: this.task.validationErrors.description, 
            start: this.task.validationErrors.start,
            startTimeString: [],
            startDateString: [],
            due: this.task.validationErrors.due,
            dueTimeString: [],
            dueDateString: [],
            workInterval: this.task.validationErrors.workInterval,
        };
        // startTimeString : Make sure time string is parseable
        //TODO: Fix, it's breaking here.
        if (!DATE_TIME_FORMATS().t.deserializer(this.startTimeStringBeingEdited).isValid) {
            errors.startTimeString.push(VALIDATION_ERROR_MESSAGES.INVALID_TIME_FORMAT);
        }
        // startDateString : Make sure date string is parseable
        if (!DATE_TIME_FORMATS().D.deserializer(this.startDateStringBeingEdited).isValid) {
            errors.startDateString.push(VALIDATION_ERROR_MESSAGES.INVALID_DATE_FORMAT);
        }
        // start : Make sure date and time strings are parseable when combined
        if (!stringToDateTimeHelper(`${this.startDateStringBeingEdited}  ${this.startDateStringBeingEdited}`).isValid) {
            // TODO Add new message for this
            errors.start.push(VALIDATION_ERROR_MESSAGES.INVALID_DATETIME_FORMAT);
        }
        // dueTimeString : Make sure time string is parseable
        if (!DATE_TIME_FORMATS().t.deserializer(this.dueTimeStringBeingEdited).isValid) {
            errors.dueTimeString.push(VALIDATION_ERROR_MESSAGES.INVALID_TIME_FORMAT);
        }
        // dueDateString : Make sure date string is parseable
        if (!DATE_TIME_FORMATS().D.deserializer(this.dueDateStringBeingEdited).isValid) {
            errors.dueDateString.push(VALIDATION_ERROR_MESSAGES.INVALID_DATE_FORMAT);
        }
        // due : Make sure date and time strings are parseable when combined
        if (!stringToDateTimeHelper(`${this.dueDateStringBeingEdited}  ${this.dueTimeStringBeingEdited}`).isValid) {
            // TODO Add new message for this
            errors.due.push(VALIDATION_ERROR_MESSAGES.INVALID_DATETIME_FORMAT);
        }
        // TODO: Figure out how to add TaskModel Validation Errors here
        return errors;
    }
    /**
     * Return true if fields in EditTaskModel are valid
     */
    get isValid () {
        let allWatchedFieldsValidated = true;
        for (let key in this.validationErrors) {
            if (this.validationErrors[`${key}`].length !== 0) {
                allWatchedFieldsValidated = false;
                break; 
            }
        }
        return allWatchedFieldsValidated;
    }
//#endregion
}