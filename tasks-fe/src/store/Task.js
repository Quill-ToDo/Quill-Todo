import { makeAutoObservable, reaction } from "mobx"
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import {  
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    taskCreationErrors,
    stringToDateTimeHelper,
    DEFAULT_DUE_DATETIME,
    DATE_TIME_FORMATS,
} from "../constants";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";

export class Task {
    id = null;
    title = null;
    complete = null;
    // Luxon Interval
    workRange = null;
    // Due separated into date and time, useful for when the task is being edited
    description = null;
    store = null;
    createdDate = null;
    beingEdited = null;

// !!! USE SETTERS TO CHANGE VALUES, EVEN IN THIS FILE. 

    /**
     * An object to represent one task in the database. It has the same fields as the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {TaskStore} store The store this task resides in.
     * @param {uuid} id V4 UUID id of the task. If one is not passed in, one is generated upon init.
     */
    constructor (store, id = v4()) {
        makeAutoObservable(this, {
            id: false,
            store: false,
            saveHandlerDisposer: false,
        }, {proxy: false});
        this.store = store;
        this.id = id;
        this.title = "";
        this.description = "";
        this.beingEdited = false;
        this.workRange = Interval.fromDateTimes(this.defaultStart, this.defaultDue);
        this.createdDate = null;

        /**
         * If autosave is on, update this task in the DB when any field used in this tasks JSON format is changed.
         */
        this.saveHandlerDisposer = reaction(
            () => this.asJson,
            json => {
                // If autosave is true, send JSON to update server
                if (this.autoSave) {
                    this.store.API.updateTask(this.id, json)
                    .catch(error => {
                        addAlert(document.querySelector('#home-wrapper'), ERROR_ALERT, "Task could not be updated - " + error.toString());
                        // Revert changes
                        this.store.loadTasks();
                    });
                }
            }
        );
    }

    /**
     * Remove this task from the taskStore. Does NOT remove it form the DB.
     */
    removeSelfFromStore() {
        this.saveHandlerDisposer();
        this.store.tasks.remove(this);
    }

    /**
     * Delete this task from the task store and server.
     */
    delete() {
        this.removeSelfFromStore();
        this.store.API.deleteTask(this.id)
        .then(() => {
            addAlert(document.getElementById('home-wrapper'), NOTICE_ALERT, "Deleted " + this.title);
        })
        .catch(error => {
            addAlert(document.getElementById('home-wrapper'), ERROR_ALERT, this.title + " could not be deleted - " + error.toString());
            this.store.add(this);
        });
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
        if (this.hasErrors) {
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
    }

    /**
     * Toggle this tasks completion status between true and false.
     */
    toggleComplete () {
        this.setComplete(!this.complete);
    }

    /**
     * If autosave is on, update this task with info pulled from the DB.
     * @param {object} json 
     */
    updateFromJson(json) {
        this.autoSave = false;
        this.setTitle(json.title);
        this.setDescription(json.description);
        this.setDue(json.due);
        this.setStart(json.start);
        this.setComplete(json.complete)
        this.createdDate = json.created_at;
        this.autoSave = true;
    }

    
    /**
     * Mark this task as the one that details should be rendered for
     */
    setFocus() {
        this.store.setFocus(this);
    }

    // ---- GETTERS ---- 

    get start () {
        return this.workRange.start;
    }

    get defaultStart () {
        return DEFAULT_DUE_DATETIME.startOf("day");
    }

    get due () {
        return this.workRange.end;
    }

    get defaultDue () {
        return DEFAULT_DUE_DATETIME;
    }


    /**
     * Returns true if the default start date is currently being used. If false, the default start is not being used.
     */

    get defaultStartBeingUsed () {
        return this.start.equals(this.defaultStart);
    }

    get startDateString () {
        return DATE_TIME_FORMATS.D.serializer(this.start);
    }

    get startTimeString () {
        return DATE_TIME_FORMATS.t.serializer(this.start);
    }

    get dueDateString () {
        return DATE_TIME_FORMATS.D.serializer(this.due);
    }

    get dueTimeString () {
        return DATE_TIME_FORMATS.t.serializer(this.due);
    }

    /**
     * Get the fields of this task formatted as a JSON
     */
    get asJson() {
        return {
            id: this.id,
            title: this.title,
            complete: this.complete,
            start: this.start ? this.start.toJSON() : "", 
            due: this.due.toJSON(),
            description: this.description
        };
    }

    // TODO: Move this method out of here
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
        const validateDateAndTimeFormatStrings = (dateString, timeString, errors) => {
            const parsedDate = DATE_TIME_FORMATS.D.deserializer(dateString);
            const parsedTime = DATE_TIME_FORMATS.t.deserializer(timeString);
            
            if (parsedTime.invalid) {
                errors.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
            }
            if (parsedDate.invalid) {
                errors.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
            }
        }

        if (!this.beingEdited) {
            return null;
        }

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

        // Title
        if (this.title.length > MAX_TITLE_LENGTH) { 
            errors.title.push(taskCreationErrors.TITLE_TOO_LONG(this.title));
        }
        else if (this.title.length === 0) {
            errors.title.push(taskCreationErrors.NO_TITLE);
        }
    
        // Description
        if (this.description.length > MAX_DESCRIPTION_LENGTH) { 
            errors.description.push(taskCreationErrors.DESCRIPTION_TOO_LONG(this.description));
        }

        //  Start 
        validateDateAndTimeFormatStrings(  
            this.startDateString, 
            this.startTimeString, 
            errors.start
        );

        // Due
        validateDateAndTimeFormatStrings(
            this.dueDateString, 
            this.dueTimeString, 
            errors.due
        );

        // If some dates and times has been changed and everything is valid, compare values
        if (
            (!errors.start.date.length && !errors.start.time.length) &&
            (!errors.due.date.length && !errors.due.time.length)
            ) {

            // If start day is after due day, invalid
            const start = this.start;
            const due = this.due;
            if ( start.hasSame(due, 'day') && start >= due) {
                errors.due.time.push(taskCreationErrors.START_TIME_AFTER_DUE);
            }
            else if ( !start.hasSame(due, 'day') && start > due) {
                errors.due.date.push(taskCreationErrors.START_DATE_AFTER_DUE);
            }
        }
        return errors;
    }
        

    /**
     * Return true is this task has any errors, false if not.
     */
    get hasErrors () {
        return (
            this.validationErrors.title.length || 
            this.validationErrors.description.length ||
            this.validationErrors.start.date.length ||
            this.validationErrors.start.time.length ||
            this.validationErrors.due.date.length ||
            this.validationErrors.due.time.length
        )
    }

    // ---- SETTERS ---- 
    // ! Important ! Use these to set values even internally because they may have side effects
    
    setTitle (title) { this.title = title; }
    setDescription (desc) { this.description = desc; }
    setComplete(complete) { this.complete = complete; }

    /**
     * Set the start of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * 
     * @param {String} dateTime 
     */
    setStart(dateTime) {
        this.setMarkerFromStringOrDt(dateTime, dateTime => Interval.fromDateTimes(dateTime, this.due !== null ? this.due : this.defaultDue));
    }
 
    /**
     * Change the start of the work interval based on the date string passed in. 
     * @param {string} dateString 
     */
    setStartDateFromString (dateString) { 
        this.setDateFromString(this.start, this.setStart, dateString);
    }

    /**
     * Change the start of the work interval based on the time string passed in. 
     * @param {string} timeString 
     */
    setStartTimeFromString (timeString) { 
        this.setTimeFromString(this.start, this.setStart, timeString);
    }

    /**
     * Set the end of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * @param {string} dateTimeString 
     */
    setDue (dateTimeString) {
        this.setMarkerFromStringOrDt(dateTimeString, dateTime => Interval.fromDateTimes(this.start !== null ? this.start : this.defaultStart, dateTime));
    }

    /**
     * Change the end of the work interval / due date based on the date string passed in. 
     * @param {string} dateString 
     */
    setDueDateFromString (dateString) {
        this.setDateFromString(this.due, this.setDue, dateString);
    }

    /**
     * Change the end of the work interval / due date based on the time string passed in. 
     * @param {string} timeString 
     */
    setDueTimeFromString (timeString) { 
        this.setTimeFromString(this.due, this.setDue, timeString);
    }

    // --- Helpers ---
    setMarkerFromStringOrDt (dateTime, callback) {
        var validatedDate = null;
        switch (typeof(dateTime)) {
            case "string":
                validatedDate = stringToDateTimeHelper(dateTime);
                break;
            case "datetime":
                validatedDate = new DateTime(dateTime);
                break;
        }
        if (validatedDate !== null) {
            callback(validatedDate);
        }
    }

    /**
     * Private helper to set the start or due time from a string passed in a custom format. The date is assumed to be the current date set for the field.
     * @param {DateTime} startOrDue this.Start or this.Due 
     * @param {function} setterCallback callback to set this.Start or this.Due given a DateTime object 
     * @param {String} timeString string in TIME_FORMAT representing the time to change to. 
     */
    setTimeFromString (startOrDue, setterCallback, timeString) { 
        const fullDate = stringToDateTimeHelper(DATE_TIME_FORMATS.D.serializer(startOrDue),  timeString);
        if (!fullDate.invalid) {
            setterCallback(fullDate); 
        } 
    }

    /**
     * Private helper to set the start or due date from a string passed. The time is assumed to be the current time set for the field.
     * @param {DateTime} startOrDue this.Start or this.Due 
     * @param {function} setterCallback callback to set this.Start or this.Due given a DateTime object 
     * @param {String} dateString string in DATE_FORMAT representing the date to change to 
     */
    setDateFromString (startOrDue, setterCallback, dateString) {
        const fullDate = stringToDateTimeHelper(dateString, DATE_TIME_FORMATS.t.serializer(startOrDue));
        if (!fullDate.invalid) {
            setterCallback(fullDate); 
        } 
    }
}