import { makeAutoObservable, reaction } from "mobx"
import { v4 } from "uuid";
import { DateTime } from "luxon";
import { 
    DATE_FORMAT, 
    TIME_FORMAT, 
    DATE_TIME_FORMAT,
    END_OF_DAY,
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    taskCreationErrors
} from "../constants";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";

const validateDateTime = (date, time, errors) => {
    const parsedDate = DateTime.fromFormat(date, DATE_FORMAT);
    const parsedTime = DateTime.fromFormat(time, TIME_FORMAT);
    
    if (parsedTime.invalid) {
        errors.time.push(taskCreationErrors.INVALID_TIME_FORMAT);
    }
    if (parsedDate.invalid) {
        errors.date.push(taskCreationErrors.INVALID_DATE_FORMAT);
    }
}

export class Task {
    id = null;
    title = null;
    complete = null;
    // Luxon DateTime object
    start = null;
    // Strings
    startDate = null
    startTime = null
    // Luxon DateTime object
    due = null;
    // Strings
    dueDate = null;
    dueTime = null;
    // Due separated into date and time, useful for when the task is being edited
    description = null;
    store = null;
    createdDate = null;
    beingEdited = null;

// USE SETTERS TO CHANGE VALUES, EVEN IN THIS FILE. 

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
        this.start = null;
        this.startDate = null;
        this.startTime = null;
        this.due = null;
        this.dueDate = null;
        this.dueTime = null;
        this.createdDate=null;

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
                this.setDue(END_OF_DAY());
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
        this.setStart(json.start);
        this.setDue(json.due);
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

    /**
     * The Luxon DateTime representing the default start date and time. It defaults to the beginning of the day of the due date
     */
    get defaultStart() {
        return this.due.set({hour:0, minute:0, second:0, millisecond: 0});
    }

    /**
     * Returns true if the default start date is currently being used. If false, the default start is not being used.
     */
    get defaultStartBeingUsed () {
        return this.start.equals(this.defaultStart);
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
        validateDateTime(
            this.startDate, 
            this.startTime, 
            errors.start
        );

        // Due
        validateDateTime(
            this.dueDate, 
            this.dueTime, 
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
    //  Use these to set values even internally bc they may have side effects
    
    setTitle (title) { 
        this.title = title;
    }
    setDescription (desc) { this.description = desc; }
    setComplete(complete) { this.complete = complete; }


    /**
     * Set the `this.start` DateTime as a Luxon DateTime object taking a date in ISO format **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * 
     * Will also update `this.startDate` and `this.startTime` if the input was valid.
     * @param {String} dateTime 
     */
    setStart(dateTime) {
        // Datetime is sometimes null here
        const date = DateTime.fromISO(dateTime);
        if (date.invalid) {
            console.error("Couldn't convert datetime " + dateTime + " " + date.invalid);
        }
        else {
            this.start = date;
            this.startDate = this.start.toFormat(DATE_FORMAT);
            this.startTime = this.start.toFormat(TIME_FORMAT);
        }
    }

    /**
     * Set `this.startDate` to be the date string passed in. 
     * 
     * If it is valid it also updates `this.start`.
     * @param {string} date 
     */
    setStartDate(date) { 
        this.startDate = date;
        this.updateStartIfValid();
    }

    /**
     * Set `this.startTime` to be the date string passed in. 
     * 
     * If it is valid it also updates `this.start`.
     * @param {string} time 
     */
    setStartTime (time) { 
        this.startTime = time; 
        this.updateStartIfValid();
    }

    /**
     * Set the `this.due` DateTime as a Luxon DateTime object taking a date in ISO format **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * 
     * Will also update `this.dueDate` and `this.dueTime` if the input was valid.
     * @param {string} dateTime 
     */
    setDue (dateTime) {
        const date = DateTime.fromISO(dateTime);
        if (date.invalid) {
            console.error("Couldn't convert datetime " + dateTime + " " + date.invalid);
        }  
        else {
            const startNeedsUpdate = this.due !== null && this.defaultStartBeingUsed;
            this.due = date;
            this.dueDate = this.due.toFormat(DATE_FORMAT);
            this.dueTime = this.due.toFormat(TIME_FORMAT);
            if (startNeedsUpdate) {
                this.setStart(this.defaultStart);
            }
        }
    }

    /**
     * Set `this.dueDate` to be the date string passed in. 
     * 
     * If it is valid it also updates `this.due`.
     * @param {string} date 
     */
    setDueDate (date) {
        this.dueDate = date;
        this.updateDueIfValid();
    }

    /**
     * Set `this.dueTime` to be the date string passed in. 
     * 
     * If it is valid it also updates `this.due`.
     * @param {string} date 
     */
    setDueTime (time) { 
        this.dueTime = time;
        this.updateDueIfValid();
    }
    // --- SETTER HELPERS ---

    /**
     * Update `this.start` based on the values of `this.startDate` and `this.startTime` if they are both valid strings in the
     * correct format.
     */
    updateStartIfValid() {
        const fullDate = DateTime.fromFormat(this.startDate + " " + this.startTime, DATE_TIME_FORMAT);
        // Errpr here, fullDAte is null
        if (!fullDate.invalid) {
            this.start = fullDate; 
        } 
    }

    /**
     * Update `this.due` based on the values of `this.dueDate` and `this.dueTime` if they are both valid strings in the
     * correct format.
     */
    updateDueIfValid() {
        const fullDate = DateTime.fromFormat(this.dueDate + " " + this.dueTime, DATE_TIME_FORMAT);
        if (!fullDate.invalid) {
            const startNeedsUpdate = this.defaultStartBeingUsed;
            this.due = fullDate; 
            if (startNeedsUpdate) {
                this.setStart(this.defaultStart);
            }
        }  
    }
}