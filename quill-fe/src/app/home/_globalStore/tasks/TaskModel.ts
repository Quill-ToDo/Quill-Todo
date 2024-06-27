import { action, computed, makeObservable, observable, reaction } from "mobx"
import pluralize from 'pluralize';
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import { 
    END_OF_DAY,
    PARTIAL_DATETIME_FORMATS,
    dateTimeHelper,
} from "@/app/@util/DateTimeHelper";
import { addAlert, ERROR_ALERT } from "@/alerts/alertEvent";
import TaskStore from "./TaskStore";
import { AxiosResponse } from "axios";

const DEFAULT_START_DATETIME = () => DateTime.now();
const DEFAULT_DUE_DATETIME = () => END_OF_DAY();

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

type ValidationTest = {
    text: string;
    fail: Function;
}

const getLegibleErrors = (errors: { [index : string]: string[] }) => {
    return Object.keys(errors).map(key => errors[key].length ? `${key}: ${(errors[key]).join(", ")}` : "").join('\n');
}

type TaskValidationTests = {
    [index : string] : ValidationTest[];
    title: ValidationTest[];
    description: ValidationTest[];
    start: ValidationTest[];
    due: ValidationTest[];
    workInterval: ValidationTest[];
    color: ValidationTest[];
    startTimeStringUnderEdit: ValidationTest[];
    startDateStringUnderEdit: ValidationTest[];
    dueTimeStringUnderEdit: ValidationTest[];
    dueDateStringUnderEdit: ValidationTest[];
    colorStringUnderEdit: ValidationTest[];

}
type TaskValidationErrors = {
    [index : string] : string[];
    title: string[];
    description: string[];
    start: string[];
    due: string[];
    workInterval: string[];
    color: string[];
    startTimeStringUnderEdit: string[];
    startDateStringUnderEdit: string[];
    dueTimeStringUnderEdit: string[];
    dueDateStringUnderEdit: string[];
    colorStringUnderEdit: string[];
};

export const TaskColorCodes = [
    { 
        key: "C0",
        data: ["#ff00ff", "#cc00ff", "#9900ff", "#6600ff", "#3322ff", "#0011ff"],
    },
    {
        key: "#C1",
        data: ["#ff00cc", "#ff33ff", "#cc33ff", "#9933ff", "#6633ff", "#3333ff", "#0033ff"],
    },
    {
        key: "C2",
        data: ["#ff0099", "#ff33cc", "#ff66ff", "#cc66ff", "#9966ff", "#6666ff", "#3366ff", "#0066ff"],
    },
    {
        key: "C3",
        data: ["#ff0066", "#ff3399", "#ff66cc", "#ff99ff", "#cc99ff", "#9999ff", "#6699ff", "#3399ff", "#0099ff"],
    },
    {
        key: "C4",
        data: ["#ff0033", "#ff3366", "#ff6699", "#ff99cc", "#ffccff", "#ccccff", "#99ccff", "#66ccff", "#33ccff", "#00ccff"],
    },
    {
        key: "C5",
        data: ["#ff0000", "#ff3333", "#ff6666", "#ff9999", "#ffcccc", "#ffffff", "#ccffff", "#99ffff", "#33ffff", "#00ffff"],
    },
    {
        key: "C6",
        data: ["#ff3300", "#ff6633", "#ff9966", "#ffcc99", "#ffffcc", "#ccffcc", "#99ffcc", "#66ffcc", "#33ffcc", "#00ffcc"],
    },
    {
        key: "C7",
        data: ["#ff6600", "#ff9933", "#ffcc66", "#ffff99", "#ccff99", "#99ff99", "#66ff99", "#33ff99", "#00ff99"],
    },
    {
        key: "C8",
        data: ["#ff9900", "#ffcc33", "#ffff66", "#ccff66", "#99ff66", "#66ff66", "#33ff66", "#00ff66"],
    },
    {
        key: "C9",
        data: ["#ffcc00", "#ffff33", "#ccff33", "#99ff33", "#66ff33", "#33ff33", "#00ff33"],
    },
    {
        key: "C10",
        data: ["#ffff00", "#ccff00", "#99ff00", "#66ff00", "#33ff00", "#00ff00"],
    },
]

/**
 * #A Task model where changes are automatically synced to the DB.
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
export class TaskModel {
//#region CLASS FIELDS AND CONSTRUCTOR
    // "name" : Type : Description
    // ----------------------------------------------------
    // ---- Public ----
            id : string = -1;
            title : string = "";
            start : DateTime = null;
            due : DateTime = null;
            description : string = "";
            complete : boolean = false;
            store : TaskStore;
            createdDate : DateTime;
            color : string = "#ffffff";
    // ---- Fields that may be used while editing the task ----
            startTimeStringUnderEdit : string = ""; 
            startDateStringUnderEdit : string = "";
            dueTimeStringUnderEdit : string = "";
            dueDateStringUnderEdit : string = "";
            colorStringUnderEdit: string = "";
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
    constructor (taskJsonData?: object) {
        makeObservable(this, {
            /// --- Task data --- 
            autoSave: observable, // Whether or not changes to this task are synced to the database. Turn on or off with `saveToServer()` and `turnOffAutosaveToDb`
            saveToServer: false,
            patchToServer: false,
            turnOffAutosaveToDb: action,
            turnOnAutosaveToDb: action,
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
            overdue: false,
            setDue: action,
            json: computed,
            setJson: action,
            setColor: action,
            color: observable, // The color of the task
            // --- Editing mode ---
            submitNewTask: action,
            abortTaskCreation: action,
            isNewAndUnsubmitted: computed,
            startDateStringUnderEdit: observable,
            setStartDateStringUnderEdit: action,
            startTimeStringUnderEdit: observable,
            setStartTimeStringUnderEdit: action,
            dueDateStringUnderEdit: observable,
            setDueDateStringUnderEdit: action,
            dueTimeStringUnderEdit: observable,
            setDueTimeStringUnderEdit: action,
            colorStringUnderEdit: observable,
            setColorStringUnderEdit: action,
            // ---
            validationTests: computed,
            validationErrors: computed, // A list of validation errors of this task.
            isValid: computed, // This task has no validation errors and is safe to sync to the database
            id: false, // This ID of this Task.
            store: false, // The store which holds and syncronizes all tasks. 
            createdDate: false, // The DateTime when this task was created
            deleteSelf: false,
        });
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
            this.start = DEFAULT_START_DATETIME();
            this.due =  DEFAULT_DUE_DATETIME();
            this.createdDate = null;
            let allColorCodes: string[] = TaskColorCodes.flatMap((item: {key: string, data: string[]}) => item.data); 
            this.color = `${(allColorCodes[Math.floor(Math.random() * (allColorCodes.length))])}`;
        }
        // Add self to the TaskStore
        this.store = TaskStore.taskStoreSingletonInstance;
        this.store.add(this);
        this.startDateStringUnderEdit = PARTIAL_DATETIME_FORMATS.D.serializer(this.start);
        this.startTimeStringUnderEdit = PARTIAL_DATETIME_FORMATS.t.serializer(this.start);
        this.dueDateStringUnderEdit = PARTIAL_DATETIME_FORMATS.D.serializer(this.due);
        this.dueTimeStringUnderEdit = PARTIAL_DATETIME_FORMATS.t.serializer(this.due);
        this.colorStringUnderEdit = this.color;
    }
//#endregion
//#region LOGICAL METHODS     
    /**
     * Delete this task
     */
    deleteSelf() {
        this.store.delete(this);
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
    setComplete(complete : boolean) { 
        this.complete = complete;
        if (this.autoSave) {
            this.patchToServer({complete: complete}); 
        }
    }
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
     * @param {string} dateTime 
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

    /**
     * 
     * @returns if this task is overdue at the moment this method
     * is called
     */
    overdue () {
        return this.due < DateTime.now() && !this.complete;
    }
//#endregion
//#region color
    /**
     * Set the color of the task to a hex code string
     */
    setColor (color : string) {
        const errors = this.getValidationErrorsForField({field: "color", paramsForTestMethod: {color}}); 
        if (!!errors.length) {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `Could not set task color ${color}: ${errors.join(", ")}`);
            return false;
        }
        this.color = color;
        this.colorStringUnderEdit = color;
        return true;
    }
//#endregion
//#region autoSave

    /**
     * Internal method to sync all of this tasks fields with its DB model
     */
    patchToServer (data: {
        title?: string,
        complete?: boolean,
        start?: DateTime,
        end?: DateTime,
        description?: string,
        color?: string,
    }=this.json) {
        this.store.API.updateTask(this.id, data).then(
            result => result,
            reason => {
                addAlert(document.querySelector('#home-wrapper'), 
                ERROR_ALERT, 
                `Task could not be updated - ${getLegibleErrors(reason.response.data)}`);
                // Revert changes
                this.store.loadTasks({refresh: true});
                return reason;
            }
        );
    }

    /**
     * Turn on autosave for this task for future changes and 
     * patch fields to the server
     */
    saveToServer (data: {
        title?: string,
        complete?: boolean,
        start?: DateTime,
        end?: DateTime,
        description?: string,
        color?: string,
    }=this.json) {
        // If has been initialized and this is not a task not yet posted to the server
        if (this.store && !this.isNewAndUnsubmitted) {
            this.turnOnAutosaveToDb();
            this.patchToServer(data);
        }
    }

    turnOnAutosaveToDb () {
        this.autoSave = true;
    }

    /**
     * Turn off autosave for this task, so that any changes to this TaskModel's fields will 
     * NOT be synced with the DB model
     */
    turnOffAutosaveToDb () {
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
            description: this.description,
            color: this.color,
        };
    } 

    /**
     * Update this TaskModel with info pulled from a passed JSON.
     * @param {object} json 
     */
    setJson(json : {[index : string]: any}) {
        this.turnOffAutosaveToDb();
        this.id = json.id;
        this.setTitle(json.title);
        this.setDescription(json.description);
        this.setStart(json.start);
        this.setDue(json.due);
        this.setComplete(json.complete)
        this.createdDate = dateTimeHelper(json.created_at);
        this.setColor(json.color);
        this.turnOnAutosaveToDb();
    }

//#endregion JSON
//#region NEW TASK CREATION
    get isNewAndUnsubmitted() {
        return this.store.taskBeingCreated === this;
    }

    /**
     * Mark a task being created as "finished" and save the task to the server
     * if changes are valid.
     */
    async submitNewTask ()  : Promise<AxiosResponse> {
        // Validate that there are no errors. If there are, raise an alert.
        if (!this.isValid) {
            const msg = `Task could not be saved, it still has errors - ${getLegibleErrors(this.validationErrors)}`;
            addAlert(document.querySelector('#new-wrapper'), 
                ERROR_ALERT, 
                msg
            );
            return (new Promise((resolve, reject) => reject(msg)));
        }
        
        // Post to server
        return this.store.API.createTask(this.json).then(
            (value) => {
                this.store.setNewTask(null);
                return value;
            },
            (reason) => {
                addAlert(
                    document.querySelector('#home-wrapper'), 
                    ERROR_ALERT, 
                    `Could not add task - ${getLegibleErrors(reason.response.data)}`
                );
                return reason;
            }
        );
    }
    /**
     * Abort the new task that was being created 
     * and delete task from the TaskStore.
     */
    abortTaskCreation () {
        this.store.setNewTask(null);
        this.store.remove(this);
    }

    /**
     * Set the date portion of the DateTime as a string. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is parseable with the time, update the actual Start 
     * DateTime. 
     * @param dateString The string the user submitted for the date portion.
     */
    setStartDateStringUnderEdit = (dateString : string)  =>  { 
        this.startDateStringUnderEdit = dateString;
        this.setStart(`${dateString}, ${this.startTimeStringUnderEdit}`);
    }
    /**
     * Set the time portion of the DateTime as a string. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is parseable with the date, update the actual Start 
     * DateTime. 
     * @param timeString The string the user submitted for the time portion.
     */
    setStartTimeStringUnderEdit = (timeString : string)  =>  { 
        this.startTimeStringUnderEdit = timeString;
        if (this.validationErrors.startTimeStringUnderEdit.length === 0 && this.validationErrors.start.length === 0) {
            this.setStart(`${this.startDateStringUnderEdit}, ${timeString}`);
        }
    }
    /**
     * Set the date portion of the DateTime as a string. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is parseable with the time, update the actual Due 
     * DateTime. 
     * @param dateString The string the user submitted for the date portion.
     */
    setDueDateStringUnderEdit (dateString : string) {
        this.dueDateStringUnderEdit = dateString;
        if (this.validationErrors.dueDateStringUnderEdit.length === 0 && this.validationErrors.due.length === 0) {
            this.setDue(`${dateString}, ${this.dueTimeStringUnderEdit}`);
        }
    }
    /**
     * Set the time portion of the DateTime as a string. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is parseable with the date, update the actual Due 
     * DateTime. 
     * @param timeString The string the user submitted for the time portion.
     */
    setDueTimeStringUnderEdit (timeString : string) { 
        this.dueTimeStringUnderEdit = timeString;
        if (this.validationErrors.dueTimeStringUnderEdit.length === 0 && this.validationErrors.due.length === 0) {
            this.setDue(`${this.dueDateStringUnderEdit}, ${timeString}`);
        }
    }
    /**
     * Set the string value that the user entered as they're editing the color. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is valid, update the actual color used as well. 
     * DateTime. 
     * @param input The hex code with the # included at the front. Should accept
     * 3 and 6 digit codes 
     */
    setColorStringUnderEdit (input : string) { 
        this.colorStringUnderEdit = input.trim();
        if (!this.validationErrors.colorStringUnderEdit.length) {
            return this.setColor(input);
        }
    }

//#endregion NEW TASK CREATION
//#endregion CLASS FIELD GETTERS AND SETTERS
//#region VALIDATION
    get validationTests(): TaskValidationTests {
        const reUsedErrorMessages = {
            INVALID_TIME_FORMAT: `Time is not of the format ${PARTIAL_DATETIME_FORMATS.t.readable}. Ex: 10:30 am`,
            INVALID_DATE_FORMAT: `Date is not of the format ${PARTIAL_DATETIME_FORMATS.D.readable}. Ex: 7/26/2022`,
            INVALID_DATETIME_FORMAT: `Date and time could not be parsed together.`,
        }
        const reUsedTests = {
            validHexCode: {
                text: `Color must be formatted as a valid hex code (ex: #ffffff)`,
                fail: ({test=this.color}: {test: string}) => !(/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(test)),
            }
        }

        return {
            title: [
                {
                    text: `Title is ${pluralize(`character`, this.title.length-MAX_TITLE_LENGTH, true)} too long`,
                    fail: ({title=this.title}: {title: string}) => title.length > MAX_TITLE_LENGTH,
                },
            ],
            description: [
                {
                    text: `Description is ${pluralize(`character`, this.description.length-MAX_DESCRIPTION_LENGTH, true)} too long`,
                    fail: ({description=this.description}: {description: string}) => description.length > MAX_DESCRIPTION_LENGTH,
                },
            ],
            start: [
                {
                    text: this.start.invalid ? this.start.invalid.explanation : "",
                    fail: ({start=this.start}: {start: DateTime}) => !start.isValid,
                },
            ],
            due: [
                {
                    text: this.due.invalid ? this.due.invalid.explanation : "",
                    fail: ({due=this.due}: {due: DateTime}) => !due.isValid,
                },
            ],
            workInterval: [
                {
                    text: `Due time must be after start time`,
                    fail: ({start=this.start, due=this.due}: {start: DateTime, due: DateTime}) => start >= due && start.hasSame(due, 'day'),
                },
                {
                    text: `Due date must be on or after start date`,
                    fail: ({start=this.start, due=this.due}: {start: DateTime, due: DateTime}) => start >= due && !start.hasSame(due, 'day'),
                },
            ],
            color: [
                reUsedTests.validHexCode,
            ],
            colorStringUnderEdit: [
                {
                    text: reUsedTests.validHexCode.text,
                    fail: () => reUsedTests.validHexCode.fail({test: this.colorStringUnderEdit}),
                }
            ],
            startTimeStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_TIME_FORMAT,
                    fail: () => !PARTIAL_DATETIME_FORMATS.t.deserializer(this.startTimeStringUnderEdit).isValid,
                },
            ],
            startDateStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_DATE_FORMAT,
                    fail: () => !PARTIAL_DATETIME_FORMATS.D.deserializer(this.startDateStringUnderEdit).isValid,
                },
            ],
            dueTimeStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_TIME_FORMAT,
                    fail: () => !PARTIAL_DATETIME_FORMATS.t.deserializer(this.dueTimeStringUnderEdit).isValid,
                },
            ],
            dueDateStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_DATE_FORMAT,
                    fail: () => !PARTIAL_DATETIME_FORMATS.D.deserializer(this.dueDateStringUnderEdit).isValid,
                },
            ],
        } as TaskValidationTests;
    }

    getValidationErrorsForField({field, paramsForTestMethod={}}: {field: string, paramsForTestMethod?: any}) {
        const errors: string[] = [];
        const casesToCheck = this.validationTests[field];

        for (let testCaseIdx in casesToCheck) {
            if (casesToCheck[testCaseIdx].fail(paramsForTestMethod)) {
                errors.push(casesToCheck[testCaseIdx].text);
            }
        }
        return errors;
    }

    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     *
     */
    get validationErrors() {
        const errors : TaskValidationErrors = {
            title: [],
            description: [],
            start: [],
            due: [],
            workInterval: [],
            color: [],
            startTimeStringUnderEdit: [],
            startDateStringUnderEdit: [],
            dueTimeStringUnderEdit: [],
            dueDateStringUnderEdit: [],
            colorStringUnderEdit: [],
        };
  
        for (let field in this.validationTests as TaskValidationTests) {
            errors[field] = this.getValidationErrorsForField({field: field});
        };

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

export module TaskModel {
    export type VisualStyles = "work" | "due";
}