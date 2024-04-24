import { action, computed, makeObservable, observable, reaction } from "mobx"
import pluralize from 'pluralize';
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import { 
    END_OF_DAY,
    dateTimeHelper,
} from "@utilities/DateTimeHelper";
import { addAlert, ERROR_ALERT } from "@/alerts/alertEvent";
import TaskStore from "./TaskStore";

const DEFAULT_DUE_DATETIME = END_OF_DAY();

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
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
            id : number = -1;
            title : string = "";
            start : DateTime = null;
            due : DateTime = null;
            description : string = "";
            complete : boolean = false;
            store : TaskStore;
            createdDate : DateTime;
    // ---- Private ----
            autoSave : boolean = true;
    // ----------------------------------------------------
    /**
     * An object to represent one task in the database. It has the same 
     * fields as the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * **Important:** Use setter methods to change any values, even internally. 
     * They may have side-effects.
     * 
     * @param {uuid} id V4 UUID id of the task. If one is not passed in, one 
     * is generated upon init.
     */
    constructor (taskJsonData : object | null = null) {
        makeObservable(this, {
            /// --- Task data --- 
            autoSave: observable, // Whether or not changes to this task are synced
            saveToServer: action,
            dontSaveToServer: action,
            //    to the database. Turn on or off with `saveToServer()` and `dontSaveToServer()
            /// --- Task data --- 
            title: observable, // Task name.
            setTitle: action,
            description: observable, // A String which describes the task
            setDescription: action,
            complete: observable, // Whether or not this task is complete.
            setComplete: action,
            toggleComplete: action,
            workRange: computed,
            start: observable, // The DateTime when the user wants to start working on this task
            setStart: action,
            due: observable, // The DateTime by which the user wants to complete the task
            setDue: action,
            json: computed,
            setJson: action,
            validationErrors: computed, // A list of validation errors of this task.
            isValid: computed, // This task has no validation errors and is safe to sync to the database
            id: false, // This ID of this Task.
            store: false, // The store which holds and syncronizes all tasks. 
            createdDate: false, // The DateTime when this task was created
            deleteSelf: false,
            saveHandlerDisposer: false,
        }, {proxy: false});
        // Initialize all class fields not using setters
        // If there was Task data passed in as JSON, update this object give
        // passed data
        if (taskJsonData) {
            this.setJson(taskJsonData);
        }
        else {
            this.id = v4();
            this.title = "";
            this.description = "";
            this.complete = false;
            this.start = DEFAULT_DUE_DATETIME.startOf("day");
            this.due =  DEFAULT_DUE_DATETIME;
            this.createdDate = null;
        }
        // Add self to the TaskStore
        this.store = TaskStore.taskStoreSingletonInstance;
        this.store.add(this);
        // Update this task in the DB when any field used in the to JSON format method is changed
        this.saveHandlerDisposer = reaction(
            () => this.json,
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
     * Delete this task
     */
    deleteSelf() {
        this.store.delete(this);
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
    setTitle (title : string) { this.title = title; }
//#endregion
//#region description
    setDescription (desc : string) { this.description = desc; }
//#endregion
//#region complete
    setComplete(complete : boolean) { this.complete = complete; }
    /**
     * Toggle this tasks completion status between true and false.
     */
    toggleComplete () {
        this.setComplete(!this.complete);
    }
//#endregion
//#region workRange
    get workRange() { 
        return Interval.fromDateTimes(this.start, this.due);
    }
//#endregion
//#region start
    /**
     * Set the start of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * 
     * @param {String} dateTime 
     */
    setStart(dateTime : DateTime) {
        try {
            const converted = dateTimeHelper(dateTime);
            this.start = converted;
        }
        catch (e) {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `Could not set task start: ${e}`);
        }
    }
//#endregion
//#region due
    /**
     * Set the end of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid to set it. 
     * @param {string} dateTime 
     */
    setDue (dateTime : DateTime) {
        try {
            const converted = dateTimeHelper(dateTime);
            this.due = converted;
        }
        catch (e) {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `Could not set task deadline: ${e}`);
        }
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
    get json() {
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
    setJson(json : object) {
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
        type TaskValidationErrors = {
            [index : string] : string[];
            title: string[];
            description: string[];
            start: string[];
            due: string[];
            workInterval: string[];
        };
        const errors : TaskValidationErrors = {
            title: [],
            description: [],
            start: [],
            due: [],
            workInterval: [],
        };
        const fieldsToValidate = {
            title: [
                {
                    text: `Title is ${pluralize(`character`, this.title.length-MAX_TITLE_LENGTH, true)} too long`,
                    fail: () => this.title.length > MAX_TITLE_LENGTH,
                },
                {
                    text:  `This task must have a name`,
                    fail: () => this.title.length === 0,
                }
            ],
            description: [
                {
                    text: `Description is ${pluralize(`character`, this.description.length-MAX_DESCRIPTION_LENGTH, true)} too long`,
                    fail: () => this.description.length > MAX_DESCRIPTION_LENGTH,
                },
            ],
            start: [
                {
                    text: this.start.invalid ? this.start.invalid.explanation : "",
                    fail: () => !this.start.isValid,
                },
            ],
            due: [
                {
                    text: this.due.invalid ? this.due.invalid.explanation : "",
                    fail: () => !this.due.isValid,
                },
            ],
            workInterval: [
                {
                    text: `Due time must be after start time`,
                    fail: () => this.start >= this.due && this.start.hasSame(this.due, 'day'),
                },
                {
                    text: `Due date must be on or after start date`,
                    fail: () => this.start >= this.due && !this.start.hasSame(this.due, 'day'),
                },
            ],
        }
        let casesToCheck;
        for (let field in fieldsToValidate) {
            casesToCheck = fieldsToValidate[field];
            for (let testCaseIdx in casesToCheck) {
                if (casesToCheck[testCaseIdx].fail()) {
                    errors[field].push(casesToCheck[testCaseIdx].text);
                }
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
//#endregion
}