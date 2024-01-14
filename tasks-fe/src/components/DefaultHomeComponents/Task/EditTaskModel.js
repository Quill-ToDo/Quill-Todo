import { makeAutoObservable } from "mobx"
import {  
    stringToDateTimeHelper,
    DATE_TIME_FORMATS,
} from "./DateTimeHelper.js";
import TaskModel from "./TaskModel.js";
import { addAlert, ERROR_ALERT } from "../Alerts/alertEvent.js";

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
        // get "task" : TaskModel : The task this inherits from.
            task = null;
        // get / set "startTimeString" : String : The text of the start time string 
            // as the user edits this task. Does not need to be a valid time string to be
            // set as this task is "in-progress" 
            startTimeStringBeingEdited = "";
        // get / set "startDateString" : String : The text of the start date string 
            // as the user edits this task. Does not need to be a valid date string to be
            // set as this task is "in-progress" 
            startDateStringBeingEdited = "";
        // get / set "dueTimeString" : String : The text of the due time string 
            // as the user edits this task. Does not need to be a valid time string to be
            // set as this task is "in-progress" 
            dueTimeStringBeingEdited = "";
        // get / set "dueDateString" : String : The text of the due date string 
            // as the user edits this task. Does not need to be a valid date string to be
            // set as this task is "in-progress" 
            dueDateStringBeingEdited = "";
        // get "validationErrors" : List<Objects> : A list of validation errors of this edited task.
        // get "isValid" : Boolean : The fields in this task are parseable and it is safe to 
            // update the parent TaskModel
        // "" : EditTaskModel : 
        // static taskBeingEdited = null;

    // ---- Private ----
    // ----------------------------------------------------
    /**
     * An object to represent one task in the database. It has the same fields as 
     * the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * **Important:** Use setter methods to change any values, even internally. 
     * They may have side-effects.
     * 
     * @param {TaskModel} task The store this task resides in.
     */
    constructor(task=null, taskStore=null) {
        makeAutoObservable(this, {
            task: true,
            startTimeString: true,
            startDateString: true,
            dueTimeString: true, 
            dueDateString: true,
        }, {proxy: false});
        var newTask;
        if (task !== null) {
            newTask = task;
        }
        else if (taskStore !== null) {
            newTask = new TaskModel(taskStore);
        }
        // Initialize all class fields not using setters
        this.task = newTask;
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
        // EditTaskModel.setTaskBeingEdited(this);
        this.task.dontSaveToServer();
        this.setTaskBeingEdited(this);
    }
    /**
     * Set the task passed as "being edited". Only one task can be in this state at a time. 
     * Updates to the trask model will not be saved to the DB, but changes will be synchronized 
     * in the UI through the TaskStore.
     * @param {TaskModel} task 
     */
    setTaskBeingEdited(task=null) {
        // EditTaskModel.taskBeingEdited = task;
        this.task.store.setEditing(task);
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
        this.store.API.createTask(this.asJson)
        .catch(e => {
            console.error(e)
            addAlert(document.querySelector('#home-wrapper'), 
            ERROR_ALERT, 
            `Could not add task - ${e}`);            
            this.removeSelfFromStore();
        });

        EditTaskModel.setTaskBeingEdited(null);
        this.task.saveToServer();
    }
    /**
     * Abort any edit changes and delete task from the TaskStore.
     */
    abortEditing () {
        EditTaskModel.setTaskBeingEdited(null);
        if (!this.createdDate) {
            // TODO make sure this is removing
            this.removeSelfFromStore();
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
    setStartDateString = (dateString)  =>  { 
        this.startDateStringBeingEdited = dateString;
        if (this.validationErrors.startDateString.length === 0) {
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
    setStartTimeString = (timeString)  =>  { 
        this.startTimeStringBeingEdited = timeString;
        if (this.validationErrors.startTimeString.length === 0) {
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
    setDueDateString (dateString) {
        this.dueDateStringBeingEdited = dateString;
        if (this.validationErrors.dueDateString.length === 0) {
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
    setDueTimeString (timeString) { 
        this.dueTimeStringBeingEdited = timeString;
        if (this.validationErrors.dueTimeString.length === 0) {
            this.task.setDue(`${this.dueDateString} ${timeString}`);
        }
    }
//#endregion
//#endregion CLASS FIELD GETTERS AND SETTERS
//#region VALIDATION
    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     * 
     */
    get validationErrors() {
        // Object to save error messages in
        const errors = {
            title: this.task.validationErrors.title,
            description: this.task.validationErrors.description, 
            start: this.task.validationErrors.start,
            startTimeString: [],
            startDateString: [],
            due: this.task.validationErrors.due,
            dueTimeString: [],
            dueDateString: [],
        }
        // startTimeString : Make sure time string is parseable
        //TODO: Fix, it's breaking here.
        if (!DATE_TIME_FORMATS().t.deserializer(this.startTimeString).isValid) {
            errors.startTimeString.push(VALIDATION_ERROR_MESSAGES.INVALID_TIME_FORMAT);
        }
        // startDateString : Make sure date string is parseable
        if (!DATE_TIME_FORMATS().D.deserializer(this.startDateString).isValid) {
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
            if (this.validationErrors[key].length !== 0) {
                allWatchedFieldsValidated = false;
                break; 
            }
        }
        return allWatchedFieldsValidated;
    }
//#endregion
}