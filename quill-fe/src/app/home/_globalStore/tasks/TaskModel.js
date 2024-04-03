import { makeAutoObservable, reaction } from "mobx"
import pluralize from 'pluralize';
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import { 
    DATE_TIME_FORMATS,
    END_OF_DAY,
    dateTimeHelper,
} from "@utilities/DateTimeHelper.js";
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "@/alerts/alertEvent.js";

const DEFAULT_DUE_DATETIME = END_OF_DAY();
/**
 * A Task model where changes are automatically synced to the DB.
 * 
 * Use setters to change values, even internally. 
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
export default class TaskModel {
//#region CLASS FIELDS AND CONSTRUCTOR
    // "name" : Type : Description
    // ----------------------------------------------------
    // ---- Public ----
        // get "id" : UUID : This ID of this Task.
            id = null;
        // get / set "title" : String : Task name.
            title = null;
        // get / set "description" : String : A String which describes the task at hand.
            description = null;
        // get / set "complete" : Boolean : Whether or not this task is complete.
            complete = false;
        // get / set "start" : Luxon DateTime : The DateTime when the user wants to start working on this task. 
            // get "startDateString" : String : The date portion of this DateTime formatted into string 
            // get "startTimeString" : String : The time portion of this DateTime formatted into string 
            // get "defaultStartBeingUsed" : Boolean : Return True if this task is usign the default start date
        // get / set "due" : Luxon DateTime : The DateTime by which the user wants to complete the task.
            // get "dueDateString" : String : The date portion of this DateTime formatted into string 
            // get "dueTimeString" : String : The time portion of this DateTime formatted into string 
        // get "store" : TaskStore : The store which holds and syncronizes all tasks. 
            store = null;
        // get "createdDate" : Luxon DateTime : The DateTime when this object was created
            createdDate = null;
        // get "isValid" : Boolean : This task has no validation errors and is safe to sync to the database
        // get "validationErrors" : List<Objects> : A list of validation errors of this task.
        // get / set "Json" : JSON : This tasks fields formatted as JSON
    // ---- Private ----
        // "autoSave" : Boolean : Whether or not changes to this task are synced
        //    to the database. Turn on or off with `saveToServer()` and `dontSaveToServer()
            autoSave = true;
        // "workRange" : Luxon Interval representing the complete range of time the
        //    user will be working on the task. Access start and end points with 
        //    `start` and `due` setters and getters.
            workRange = null;
            invalidStart = null;
            invalidDue = null;
        // get "defaultStart" : Luxon DateTime : Default start date of any task
        // get "defaultDue" : Luxon DateTime : Default due date of any task
    // ----------------------------------------------------
    /**
     * An object to represent one task in the database. It has the same 
     * fields as the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * **Important:** Use setter methods to change any values, even internally. 
     * They may have side-effects.
     * 
     * @param {TaskStore} store The store this task will be added to.
     * @param {uuid} id V4 UUID id of the task. If one is not passed in, one 
     * is generated upon init.
     */
    constructor (store, jsonData = null) {
        makeAutoObservable(this, {
            id: false,
            store: false,
            saveHandlerDisposer: false,
        }, {proxy: false});
        // Initialize all class fields not using setters
        this.id = v4();
        this.title = "";
        this.description = "";
        this.workRange = Interval.fromDateTimes(this.defaultStart, this.defaultDue);
        this.invalidStart = null;
        this.invalidDue = null;
        this.createdDate = null;
        // If there was Task data passed in as JSON, update this object give
        // passed data
        if (jsonData) {
            this.setJson(jsonData);
        }
        // Add self to the TaskStore
        this.store = store;
        this.store.add(this);
        // Update this task in the DB when any field used in the to JSON format method is changed
        this.saveHandlerDisposer = reaction(
            () => this.asJson,
            json => {
                // If autosave is true, send JSON to update server
                if (this.autoSave) {
                    this.store.API.updateTask(this.id, json)
                    .catch(error => {
                        addAlert(document.querySelector('#home-wrapper'), 
                        ERROR_ALERT, "Task could not be updated - " + error.toString());
                        // Revert changes
                        this.store.loadTasks();
                    });
                }
            }
        );
    }
//#endregion
//#region LOGICAL METHODS     
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
            addAlert(document.getElementById('home-wrapper'), 
            NOTICE_ALERT, "Deleted " + this.title);
        })
        .catch(error => {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, this.title + " could not be deleted - " + error.toString());
            this.store.add(this);
        });
    } 
    /**
     * Mark this task as the one that detail pop-up should be rendered for
     */
    setFocus() {
        this.store.setFocus(this);
    }
//#endregion
//#region CLASS FIELD GETTERS AND SETTERS
//#region title
    setTitle (title) { this.title = title; }
//#endregion
//#region description
    setDescription (desc) { this.description = desc; }
//#endregion
//#region complete
    setComplete(complete) { this.complete = complete; }
    /**
     * Toggle this tasks completion status between true and false.
     */
    toggleComplete () {
        this.setComplete(!this.complete);
    }
//#endregion
//#region workRange
    setWorkRange(start, end) { 
        this.workRange = Interval.fromDateTimes(start, end);
        if (!this.workRange.isValid) {
        }
            this.invalidStart = start;
            this.invalidDue = end;

    }
//#endregion
//#region start
    /**
     * Get the start DateTime
     */
    get start () {
        return this.workRange.start ? this.workRange.start : this.invalidStart;
    }
    /**
     * Set the start of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * 
     * @param {String} dateTime 
     */
    setStart(dateTime) {
        try {
            const converted = dateTimeHelper(dateTime);
            this.setWorkRange(converted, this.due);
        }
        catch (e) {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `Could not set task start: ${e}`);
        }
    }
    /**
     * Get the date portion as a string of the validated start DateTime
    */
    get startDateString () {
        return DATE_TIME_FORMATS().D.serializer(this.start);
    }
    /**
     * Get the time portion as a string of the validated start DateTime
    */
    get startTimeString () {
        return DATE_TIME_FORMATS().t.serializer(this.start);
    }
    /**
     * Get the default start DateTime
     */
    get defaultStart () {
        return DEFAULT_DUE_DATETIME.startOf("day");
    }
    /**
     * Returns true if the default start date is currently being used. 
     * If false, the default start is not being used.
     */
    get defaultStartBeingUsed () {
        return this.start.equals(this.defaultStart);
    }
//#endregion
//#region due
    /**
     * Get the due DateTime
     */
    get due () {
        return this.workRange.end ? this.workRange.end : this.invalidDue;
    }
    /**
     * Set the end of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * @param {string} dateTime 
     */
    setDue (dateTime) {
        try {
            this.setWorkRange(this.start, dateTimeHelper(dateTime));
        }
        catch (e) {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `Could not set task deadline: ${e}`);
        }
    }
    /**
     * Get the date portion as a string of the validated due DateTime
     */
    get dueDateString () {
        return DATE_TIME_FORMATS().D.serializer(this.due);
    }
    /**
     * Get the time portion as a string of the validated due DateTime
     */
    get dueTimeString () {
        return DATE_TIME_FORMATS().t.serializer(this.due);
    }
    /**
     * Get the default due DateTime
     */
    get defaultDue () {
        return DEFAULT_DUE_DATETIME;
    }
//#endregion
//#region autoSave
    /**
     * Turn on autosave for this task, so that changes to this TaskModel's fields will be 
     * synced with the DB model
     */
    saveToServer () {
        this.autoSave = true;
    }
    /**
     * Turn off autosave for this task, so that changes to this TaskModel's fields will be 
     * synced with the DB model
     */
    dontSaveToServer () {
        this.autoSave = false;
    }
//#endregion
//#region JSON
    /** 
     * Get the fields of this task formatted as a JSON
     */
    get Json() {
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
     * Update this TaskModel with info pulled from a passed JSON.
     * @param {object} json 
     */
    setJson(json) {
        this.dontSaveToServer();
        this.id = json.id;
        this.setTitle(json.title);
        this.setDescription(json.description);
        this.setStart(json.start);
        this.setDue(json.due);
        this.setComplete(json.complete)
        this.createdDate = dateTimeHelper(json.created_at);
        this.saveToServer();
    }
//#endregion JSON
//#endregion CLASS FIELD GETTERS AND SETTERS
//#region VALIDATION
    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     *
     */
    get validationErrors() {
        const errors = {
            title: [],
            description: [],
            start: [],
            due: [],
            workInterval: [],
        }

        const errorMessages = {
            NO_TITLE: `Give this task a name`,
            TITLE_TOO_LONG: (title) => `Title is ${pluralize(`character`, title.length-MAX_TITLE_LENGTH, true)} too long`,
            DESCRIPTION_TOO_LONG: (description) => `Description is ${pluralize(`character`, description.length-MAX_DESCRIPTION_LENGTH, true)} too long`,
            START_TIME_AFTER_DUE: `Due time must be after start time`,
            START_DATE_AFTER_DUE: `Due date must be on or after start date`,
        }
        
        const MAX_TITLE_LENGTH = 100;
        const MAX_DESCRIPTION_LENGTH = 1000;

        //TODO: Implement this
        // const validationCases = {
        //     title: [
        //         {
        //             invalid: this.title.length > MAX_TITLE_LENGTH,
        //             text: `Title is ${pluralize(`character`, this.title.length-MAX_TITLE_LENGTH, true)} too long`,
        //         },
        //         {
        //             invalid: this.title.length === 0,
        //             text:  `This task must have a name`,
        //         }
        //     ]
        // }

        // let caseToCheck;
        // for (let field in validationCases) {
        //     caseToCheck = validationCases[field];
        //     if (caseToCheck.invalid) {
        //         errors[field].push(caseToCheck.text);
        //     }
        // }

        // title 
        //    1 : Make sure title is not too long
        if (this.title.length > MAX_TITLE_LENGTH) { 
            errors.title.push(errorMessages.TITLE_TOO_LONG(this.title));
        }
        //    2 : Make sure title is not empty
        else if (this.title.length === 0) {
            errors.title.push(errorMessages.NO_TITLE);
        }
        // description : Make sure description is not too long
        if (this.description.length > MAX_DESCRIPTION_LENGTH) { 
            errors.description.push(
                errorMessages.DESCRIPTION_TOO_LONG(this.description));
        }
        // start : N/A
        // due : N/A
        // workInterval 
        //    1 : Make sure start is not after due
        if (this.start >= this.due) {
            if (this.start.hasSame(this.due, 'day')) {
                errors.workInterval.push(errorMessages.START_TIME_AFTER_DUE);
            }
            else {
                errors.workInterval.push(errorMessages.START_DATE_AFTER_DUE);
            }
        }
        return errors;
    }
    /**
     * Return true is this task has any errors, false if not.
     */
    get isValid () {
        for (let key in this.validationErrors) {
            if (this.validationErrors[key].length !== 0) {
                return false; 
            }
        }
        return true;
    }

    //     /**
    //  * Update the mapping of days : tasks for that day when the start or due is changed. 
    //  * Pass EITHER startOld (previous start date) and startNew (date start is being changed to) as DateTime or dueOld and dueNew as DateTime.
    //  * @param {DateTime} dates 
    //  * @returns 
    //  */
    //     updateIntervalMappings({startOld=null, startNew=null, dueOld=null, dueNew=null}={}) {
    //         const removeTaskFromDate = (date) => {
     
    //         }
    //         const addTaskToDate = (date) => {
    //             const key = date.DATE_SHORT;
    //             if (!this.store.timeline.daysAsMap.has(key)) {
    //                 this.store.timeline.daysAsMap.set(key, new Set());
    //             }
    //             this.store.timeline.daysAsMap.get(key).add(this);
    //         }
    
    //         let action = null;
    //         let iterationStart = null;
    //         let iterationEnd = null;
    
    //         if (startOld != null && startNew != null) {
    //             if (startNew.equals(startOld)) {
    //                 return;
    //             }
    //             iterationStart = DateTime.min(startOld, startNew);
    //             iterationEnd = DateTime.max(startOld, startNew);
    //             if (startOld < startNew) {
    //                 action = removeTaskFromDate; 
    //             }
    //             else {
    //                 action = addTaskToDate;
    //             }
    //         }
    //         else if (dueOld != null && dueNew != null) {
    //             if (dueNew.equals(dueOld)) {
    //                 return;
    //             }
    //             iterationStart = DateTime.min(dueNew, dueOld);
    //             iterationEnd = DateTime.max(dueNew, dueOld);
    //             if (dueOld > dueNew) {
    //                 action = removeTaskFromDate; 
    //             }
    //             else {
    //                 action = addTaskToDate;
    //             }
    //         }
    //         else {
    //             return;
    //             //throw new TypeError("Both oldDue and due or oldStart and start must be provided.")
    //         }
    
    //         // Iterate through difference of days and either add or remove the task from being mapped to that date
    //         iterationEnd = iterationEnd.endOf("day");
    //         iterationStart = iterationStart.startOf("day");
    //         let current = iterationStart;
    //         while (current < iterationEnd) {
    //             action(current);
    //             current = current.plus({days: 1});
    //         }
    //     }
//#endregion
}