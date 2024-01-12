import { makeAutoObservable } from "mobx"
import {  
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    taskCreationErrors,
    stringToDateTimeHelper,
    DATE_TIME_FORMATS,
} from "../constants.js";
import Task from "./Task";
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../Alerts/alertEvent.js";

export default class EditTaskModel {
    task;
    beingEdited;
    startTimeString;
    dueTimeString;
    startDateString;
    dueDateString;
    validationErrors;

    
// !!! USE SETTERS TO CHANGE VALUES, EVEN IN THIS FILE. 

    /**
     * An object to represent one task in the database. It has the same fields as the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {Task} task The store this task resides in.
     */
    init(task) {
        makeAutoObservable(this, {
            task: false,
        }, {proxy: false});
        this.task = task;
        this.beingEdited = true;
        this.startTimeString = DATE_TIME_FORMATS.t.serializer(this.task.start);
        this.dueTimeString = DATE_TIME_FORMATS.t.serializer(this.task.due);
        this.startDateString = DATE_TIME_FORMATS.D.serializer(this.task.start);
        this.dueDateString = DATE_TIME_FORMATS.D.serializer(this.task.due);
    }

    // ---- GETTERS ----
    /**
     * Returns true if the default start date is currently being used.
     */
    get defaultStartBeingUsed () {
        return this.task.start.equals(this.defaultStart);
    }

    get startDateString () {
        return this.startDateString;
    }

    get startTimeString () {
        return this.startTimeString;
    }

    get dueDateString () {
        return this.dueDateString;
    }

    get dueTimeString () {
        return this.dueTimeString;
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
        /// --- Title Errors ---
        /// --------------------
        if (this.title.length > MAX_TITLE_LENGTH) { 
            errors.title.push(taskCreationErrors.TITLE_TOO_LONG(this.title));
        }
        else if (this.title.length === 0) {
            errors.title.push(taskCreationErrors.NO_TITLE);
        }
    
        /// --------------------------
        /// --- Description Errors ---
        /// --------------------------
        if (this.description.length > MAX_DESCRIPTION_LENGTH) { 
            errors.description.push(taskCreationErrors.DESCRIPTION_TOO_LONG(this.description));
        }

        /// --------------------
        /// --- Start Errors ---
        /// --------------------
        // Make sure date and time tokens are parseable separately
        if (!DATE_TIME_FORMATS.t.deserializer(this.startTimeString).isValid()) {
            errors.start.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
        }
        if (!DATE_TIME_FORMATS.D.deserializer(this.startDateString).isValid()) {
            errors.start.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
        }
        // Make sure date and time tokens are parseable together
        if (!stringToDateTimeHelper(`${this.startDateString}  ${this.startTimeString}`).isValid()) {
            // TODO Add new message for this
            errors.start.date.push(taskCreationErrors.INVALID_DATETIME_FORMAT);
        }

        /// --------------------
        /// --- Due Errors -----
        /// --------------------
        // Make sure date and time tokens are parseable separately
        if (!DATE_TIME_FORMATS.t.deserializer(this.dueTimeString).isValid()) {
            errors.due.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
        }
        if (!DATE_TIME_FORMATS.D.deserializer(this.dueDateString).isValid()) {
            errors.due.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
        }
        // Make sure date and time tokens are parseable together
        if (!stringToDateTimeHelper(`${this.dueDateString}  ${this.dueTimeString}`).isValid()) {
            // TODO Add new message for this
            errors.due.date.push(taskCreationErrors.INVALID_DATETIME_FORMAT);
        }

        /// -----------------------------------
        /// --- Start vs. Due String Errors ---
        /// -----------------------------------
        // If some dates and times has been changed and start and due can both be converted to DateTimes,
        // compare their values
        if (
            (!errors.start.date.length && !errors.start.time.length) &&
            (!errors.due.date.length && !errors.due.time.length)
            ) {
                // If start day is after due day, invalid
                const start = stringToDateTimeHelper(`${this.startDateString}  ${this.startTimeString}`);
                const due = stringToDateTimeHelper(`${this.dueDateString}  ${this.dueTimeString}`);
                if ( start.hasSame(due, 'day') && start >= due) {
                    errors.due.time.push(taskCreationErrors.START_TIME_AFTER_DUE);
                }
                else if ( !start.hasSame(due, 'day') && start > due) {
                    errors.due.date.push(taskCreationErrors.START_DATE_AFTER_DUE);
                }
        }
        return errors;
    }

    // get dateTimeStringPartsAreValid () {
    //     return !(this.validationErrors.start.date.length ||
    //         this.validationErrors.start.time.length ||
    //         this.validationErrors.due.date.length ||
    //         this.validationErrors.due.time.length);
    // }
        
    /**
     * Return true if this task has no validation errors, false if it does.
     */
    get isValid () {
        return (
            !(this.validationErrors.title.length || 
            this.validationErrors.description.length)
            && this.dateTimeStringPartsAreValid
        )
    }

    // ---- SETTERS ---- 
    // ! Important ! Use these to set values even internally because they may have side effects

    setStartDate (dateString) { 
        // Set string to whatever the user typed
        this.startDateString = dateString;
        // Only if this is can be converted to valid DateTime, update the overall start of the task.
        if (this.dateTimeStringPartsAreValid) {
            this.task.setStart();
        }
    }

    setStartTime (timeString) { 
        // Set string to whatever the user typed
        this.startTimeString = timeString;
        if (this.dateTimeStringPartsAreValid) {
            this.task.setStart();
        }
    }

    setDueDate (dateString) {
        this.dueDateString = dateString;
        if (this.dateTimeStringPartsAreValid) {
            this.task.setStart();
        }
    }

    setDueTime (timeString) { 
        this.dueTimeString = timeString;
        if (this.dateTimeStringPartsAreValid) {
            this.task.setStart();
        }
    }
        
    /**
     * Mark a task as being edited. This turns off autosave so changes made are not saved to the DB until `this.finishEditing` is called, or 
     * changes are aborted with `this.abortEditing`.
     */
    startEditing() {
        this.beingEdited = true;
        this.store.taskBeingEdited = this;
        if (!this.createdDate) {
            this.autoSave = false;
            // If this is a new task, set defaults
            this.setComplete(false);
            if (!this.due) {
                this.setDue(this.defaultDue);
                this.setStart(this.defaultStart);
            }
        }
    }

    /**
     * Mark a task being edited as finished and save the task to the DB.
     */
    finishEditing () {
        // Validate that there are no errors. If there are, raise an alert.
        if (this.isValid) {
            addAlert(document.querySelector('#new-wrapper'), ERROR_ALERT, "Task could not be saved, it still has errors - " + this.validationErrors);
            console.error(this.validationErrors);
            console.error(this);
            return;
        } 
        
        // Post to server
        this.store.API.createTask(this.asJson)
        .catch(e => {
            console.error(e)
            addAlert(document.querySelector('#home-wrapper'), ERROR_ALERT, "Could not add task - " + e);            
            this.removeSelfFromStore();
        });
        this.beingEdited = false;
        this.store.taskBeingEdited = null;
        this.autoSave = true;
    }

    /**
     * Abort any edits and delete task from the taskStore.
     */
    abortEditing () {
        this.beingEdited = false;
        this.store.taskBeingEdited = null;
        if (!this.createdDate) {
            // TODO make sure this is removing
            this.removeSelfFromStore();
        }
        else {
            // TODO
        }
    }

    /**
    * Create a new task marked as currently being edited. It will need to have
    * `finishEditing()` called on it to save it to the DB.
    * @param {object} options Pass an optional default `dueDate` or `startDate` or both in an object. Keys are symbols, values should be 
    * a Luxon DateTime or string in ISO format.
    */
    static createInProgressTask (TaskStore, {dueDate=null, dueTime=null, startDate=null, startTime=null} = {}) {
        const task = new EditTaskModel((new Task(TaskStore)));
        if (dueDate) {
            task.setDueDate(dueDate);
        }
        if (startDate) {
            task.setStartDate(startDate);
        }
        task.startEditing(); 
        TaskStore.add(task);
        return task;
    }
}