import { makeAutoObservable } from "mobx"
import {  
    taskCreationErrors,
    stringToDateTimeHelper,
    DATE_TIME_FORMATS,
} from "../constants.js";
import TaskModel from "./TaskModel.js";
import { addAlert, ERROR_ALERT } from "../Alerts/alertEvent.js";

export default class EditTaskModel {
// !!! Fields must have defaults set here to be observable. 
    task = null;
    beingEdited = true;
    startTimeStringBeingEdited = "";
    dueTimeStringBeingEdited = "";
    startDateStringBeingEdited = "";
    dueDateStringBeingEdited = "";
    // static taskBeingEdited = null;

    
// !!! USE SETTERS TO CHANGE VALUES, EVEN IN THIS FILE. 

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
        this.task = newTask;
        this.setStartTimeString(DATE_TIME_FORMATS.t.serializer(this.task.start));
        this.setDueTimeString(DATE_TIME_FORMATS.t.serializer(this.task.due));
        this.setStartDateString(DATE_TIME_FORMATS.D.serializer(this.task.start));
        this.setDueDateString(DATE_TIME_FORMATS.D.serializer(this.task.due));
        this.startEditing(); 
    }

// --------------------------------------------------------------------
// ------------------------ LOGICAL METHODS ---------------------------
// --------------------------------------------------------------------

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
        this.setTaskBeingEdited(this.task);
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

// -----------------------------------------------------------------------
// ------------------------------- GETTERS ------------------------------- 
// -----------------------------------------------------------------------

    get startDateString () {
        return this.startDateStringBeingEdited;
    }
    get startTimeString () {
        return this.startTimeStringBeingEdited;
    }
    get dueDateString () {
        return this.dueDateStringBeingEdited;
    }
    get dueTimeString () {
        return this.dueTimeStringBeingEdited;
    }
    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     * 
     * {
     *      title: [],
     *      description: [],
     *       start: {
     *           date: [],
     *           time: []
     *       },
     *       due: 
     *          date: [],
     *          time: []
     *       }
     *   }
     */
    get validationErrors() {
        // Object to save error messages in
        const errors = {
            title: [],
            description: [],
            start: {
                date: [],
                time: []
            },
            due: {
                date: [],
                time: []
            }
        }

        /// --------------------
        /// --- Start Errors ---
        /// --------------------
        // Make sure date and time tokens are parseable separately
        if (!DATE_TIME_FORMATS.t.deserializer(this.startTimeStringBeingEdited).isValid()) {
            errors.start.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
        }
        if (!DATE_TIME_FORMATS.D.deserializer(this.startDateStringBeingEdited).isValid()) {
            errors.start.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
        }
        // Make sure date and time tokens are parseable together
        if (!stringToDateTimeHelper(`${this.startDateStringBeingEdited}  ${this.startTimeStringBeingEdited}`).isValid()) {
            // TODO Add new message for this
            errors.start.date.push(taskCreationErrors.INVALID_DATETIME_FORMAT);
        }

        /// --------------------
        /// --- Due Errors -----
        /// --------------------
        // Make sure date and time tokens are parseable separately
        if (!DATE_TIME_FORMATS.t.deserializer(this.dueTimeStringBeingEdited).isValid()) {
            errors.due.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
        }
        if (!DATE_TIME_FORMATS.D.deserializer(this.dueDateStringBeingEdited).isValid()) {
            errors.due.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
        }
        // Make sure date and time tokens are parseable together
        if (!stringToDateTimeHelper(`${this.dueDateStringBeingEdited}  ${this.dueTimeStringBeingEdited}`).isValid()) {
            // TODO Add new message for this
            errors.due.date.push(taskCreationErrors.INVALID_DATETIME_FORMAT);
        }

        return errors;
    }
    get dateTimeStringPartsAreValid () {
        return !(this.validationErrors.start.date.length ||
            this.validationErrors.start.time.length ||
            this.validationErrors.due.date.length ||
            this.validationErrors.due.time.length);
    }
    /**
     * Return true if this task has no validation errors, false if it does.
     */
    get isValid () {
        return (
            !(this.validationErrors.title.length || 
            this.validationErrors.description.length)
            && this.dateTimeStringPartsAreValid
            && this.task.isValid()
        );
    }

// -----------------------------------------------------------------------
// ------------------------------- SETTERS ------------------------------- 
// -----------------------------------------------------------------------
//
// !!! Important !!! Use these methods to set values, even internally, because 
// they may have side effects...

    /**
     * Set start date portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setStartDateString (dateString) { 
        // Set string to whatever the user typed
        this.startDateStringBeingEdited = dateString;
        this.task.setStartDateFromString(dateString);
    }
    /**
     * Set start time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} timeString 
     */
    setStartTimeString = (timeString)  =>  { 
        this.startTimeStringBeingEdited = timeString;
        this.task.setStartTimeFromString(timeString);
    }
    /**
     * Set due date portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueDateString (dateString) {
        this.dueDateStringBeingEdited = dateString;
        this.task.setDueDateFromString(dateString);
    }
    /**
     * Set due time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueTimeString (timeString) { 
        this.dueTimeStringBeingEdited = timeString;
        this.task.setDueTimeFromString(timeString);
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
}