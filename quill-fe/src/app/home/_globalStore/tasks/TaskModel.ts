import { action, computed, makeObservable, observable, reaction } from "mobx"
import pluralize from 'pluralize';
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import { 
    DATETIME_FORMATS,
    END_OF_DAY,
    PARTIAL_DATETIME_FORMATS,
    dateTimeHelper,
} from "@/app/@util/DateTimeHelper";
import { addAlert, ERROR_ALERT } from "@/alerts/alertEvent";
import TaskStore from "./TaskStore";
import { AxiosResponse } from "axios";
import { Context, createContext } from "react";
import { HOME_ID } from "../../dashboardLayout";

export const DEFAULT_START_DATETIME = () => DateTime.now();
export const DEFAULT_DUE_DATETIME = () => END_OF_DAY();

export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 10000;

type ValidationTest = {
    text: string;
    fail: Function;
};

const getLegibleErrors = (errors: { [index : string]: string[] }) => {
    return Object.keys(errors).map(key => errors[key].length ? `${key}: ${(errors[key]).join(", ")}` : "").join('\n');
};

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
};

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

type EditableTaskFields =  "title" | "complete" | "start" | "showStartTime" | "due" | "showDueTime" | "description" | "color";

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
 * A Task model where changes are automatically synced to the DB.
 * 
 *  - Fields must have defaults set in CLASS FIELDS region to be observable. 
 *  - Define getter, setter, and validation errors for each class field in 
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
            private _id : string = "";
            private _title : string = "";
            private _start : DateTime | null = null;
            private _showStartTime : boolean = true;
            private _due : DateTime | null = null;
            private _showDueTime : boolean = true;
            private _description : string = "";
            private _complete : boolean = false;
            private _createdDate : DateTime;
            private _color : string = "#ffffff";
            private _store : TaskStore | undefined;
            private _startTimeStringUnderEdit : string = ""; 
            private _startDateStringUnderEdit : string = "";
            private _dueTimeStringUnderEdit : string = "";
            private _dueDateStringUnderEdit : string = "";
            private _colorStringUnderEdit: string = "";
            autoSave : boolean = true;

    /**
     * An object to represent one task in the database. It has the same 
     * fields as the task in the database and handles updating the task in the DB
     * when any relevant fields change. 
     * 
     * @param {uuid} id V4 UUID id of the task. If one is not passed in, one 
     * is generated upon init.
     */
    constructor ({taskJsonData, store}:{taskJsonData?: object, store: TaskStore}) {
        makeObservable(this, {
            /// --- Task data --- 
            _id: false, // This ID of this task
            id: computed,
            _store: false, // The store which holds and syncronizes all tasks 
            _createdDate: false, // The DateTime when this task was created
            _title: observable, // Task name
            title: computed,
            _description: observable, // A string that describes the task
            description: computed,
            _complete: observable, // Whether or not this task is complete
            complete: computed,
            toggleComplete: action, // Flip the completion status of the task
            workRange: computed, // Range of the start to due date of this task
            _start: observable, // The DateTime when the user wants to start working on this task
            start: computed,
            _showStartTime: observable,
            showStartTime: computed,
            _due: observable, // The DateTime by which the user wants to complete the task by
            due: computed,
            _showDueTime: observable,
            showDueTime: computed,
            overdue: false, // Is the current time and date past the due time and date
            _color: observable, // The color of the task
            color: computed,
            json: computed, // This tasks data in JSON form
            // --- Editing mode ---
            submitNewTask: action, // Submit this task to the server (if new)
            isNewAndUnsubmitted: computed, // Is this a new task being created?
            /// vvv all fields that are for display purposes during editing. For example, 
            // if the user enters a string "3cshjaklfdhsa" for the startDateStringUnderEdit, 
            // this value can be displayed as needed in form fields to show the user typing but
            // will not change the underlying start DateTime because it can't be parsed. 
            _startDateStringUnderEdit: observable,
            startDateStringUnderEdit: computed,
            _startTimeStringUnderEdit: observable,
            startTimeStringUnderEdit: computed,
            _dueDateStringUnderEdit: observable,
            dueDateStringUnderEdit: computed,
            _dueTimeStringUnderEdit: observable,
            dueTimeStringUnderEdit: computed,
            _colorStringUnderEdit: observable,
            colorStringUnderEdit: computed,
            abortTaskCreation: action, // Abandon the task being created
            deleteSelf: false, // Delete this task from the server
            // --- Server Syncing ---
            autoSave: observable, // Whether or not changes to this task are synced to the 
            // database. Turn on or off with `saveEdits()` and `turnOffAutosaveToDb`.
            saveEdits: false, // Update all task properties to server. Can still be called if autosave is off.
            patchToServer: false, // Save specific properties of the task to the server. Can still be called even if autosave is off.
            // --- Validation ---
            validationTests: computed,
            validationErrors: computed, // A list of validation errors of this task.
            isValid: computed, // This task has no validation errors and is safe to sync to the database
        });
        // Initialize all class fields not using setters
        // If there was Task data passed in as JSON, update this object given
        // passed data
        this.autoSave = false;
        if (taskJsonData) {
            this.json = taskJsonData;
        }
        else {
            this._id = v4();
            this.title = "";
            this.description = "";
            this.complete = false;
            this.start = DEFAULT_START_DATETIME();
            this.due =  DEFAULT_DUE_DATETIME();
            this._createdDate = DateTime.now();
            let allColorCodes: string[] = TaskColorCodes.flatMap((item: {key: string, data: string[]}) => item.data); 
            this.color = `${(allColorCodes[Math.floor(Math.random() * (allColorCodes.length))])}`;
        }
        // Add self to the TaskStore
        if (store) {
            this._store = store;
            this._store.add(this);
        }
        this.setStartDateAndTimeStringsUnderEdit();
        this.setDueDateAndTimeStringsUnderEdit();
        if (this.color) {
            this.colorStringUnderEdit = this.color;
        }
        this.autoSave = true;
    }
//#endregion
//#region LOGICAL METHODS     
    /**
     * Delete this task
     */
    deleteSelf() {
        if (this._store) {
            this._store.delete(this);
        }
    }
//#endregion
//#region CLASS FIELD GETTERS AND SETTERS
//#region id
    get id () { return this._id; }
//#endregion
//#region created date
    get createdDate () { return this._createdDate; }
//#endregion
//#region title
    set title (title : string) { this._title = title; }
    get title () { return this._title; }
//#endregion
//#region description
    get description () { return this._description; }
    set description (desc : string) { this._description = desc; }
//#endregion
//#region complete
    set complete(complete : boolean) { 
        this._complete = complete;
        if (this.autoSave) {
            this.patchToServer("complete"); 
        }
    }
    get complete() { return this._complete; }
    /**
     * Toggle this tasks completion status between true and false.
     */
    toggleComplete () {
        this.complete = !this.complete;
    }
//#endregion
//#region workRange
    get workRange() { 
        return this.start && this.due ? Interval.fromDateTimes(this.start, this.due) : undefined;
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
    set start(dateTime : DateTime | null) {
        const originalStartTime = this._start;
        if (dateTime ===  null) {
            this._start = dateTime;
            return;
        } 
        try {
            const converted = dateTimeHelper(dateTime);
            this._start = converted;
            if (originalStartTime === null) {
                this.setStartDateAndTimeStringsUnderEdit()
            }
        }
        catch (e) {
            addAlert(document.getElementById(HOME_ID), 
            ERROR_ALERT, `Could not set task start: ${e}`);
        }
    }
    /** The start date as a Luxon DateTime */
    get start () { return this._start; }
    get showStartTime () {return this._showStartTime; }
    set showStartTime (val) {
        if (val === false && this.start) {
            this.start = this.start.endOf("day");
            this.saveEdits("start");
        }
        this._showStartTime = val;
    }
    setStartDateAndTimeStringsUnderEdit () {
        this._startDateStringUnderEdit = this.start ? PARTIAL_DATETIME_FORMATS.D.serializer(this.start) : "";
        this._startTimeStringUnderEdit = this.start ? PARTIAL_DATETIME_FORMATS.t.serializer(this.start) : ""; 
    }

    /**
     * Set the date portion of the DateTime as a string. 
     * It does not need to be valid. If it is invalid, validation errors will be generated.
     * If it is parseable with the time, update the actual Start 
     * DateTime. 
     * @param dateString The string the user submitted for the date portion.
     */
    set startDateStringUnderEdit (dateString : string)  { 
        this._startDateStringUnderEdit = dateString;
        if (dateString === "") {
            this.start = null;
            return;
        }
        if (this.validationErrors.startDateStringUnderEdit.length === 0) {
            const newDate = DATETIME_FORMATS.D_t.deserializer(dateString, 
                this.start ? PARTIAL_DATETIME_FORMATS.t.serializer(this.start) : this.startTimeStringUnderEdit);
                if (!newDate.invalid) {
                    // If the datetime generated using the time part of the current start datetime and the 
                    // date string under edit is valid, update underlying start datetime
                    this._start = newDate;
                }
        }
    }
    get startDateStringUnderEdit () { return this._startDateStringUnderEdit; }
    /**
     * Set the time portion of the DateTime as a string. 
     * It does not need to be valid. If it is invalid, validation errors will be generated.
     * If it is parseable with the date, update the actual Start 
     * DateTime. 
     * @param timeString The string the user submitted for the time portion.
     */
    set startTimeStringUnderEdit (timeString : string) { 
        this._startTimeStringUnderEdit = timeString;
        if (this.validationErrors.startTimeStringUnderEdit.length === 0) {
            const newDate = DATETIME_FORMATS.D_t.deserializer(this.start ? PARTIAL_DATETIME_FORMATS.D.serializer(this.start) : this.startDateStringUnderEdit, 
                timeString);
            if (!newDate.invalid) {
                // If the date generated using the date part of the current start datetime and the 
                // time string under edit is valid, update underlying start datetime
                this._start = newDate;
            }
        }
    }
    get startTimeStringUnderEdit () { return this._startTimeStringUnderEdit; }
//#endregion
//#region due
    /**
     * Set the end of the work Interval as a Luxon DateTime object taking a datetime string in ISO format 
     * **OR as a Luxon DateTime object**. 
     * dateTime must be valid. 
     * @param {string} dateTime 
     */
    set due (dateTime : DateTime | null) {
        const originalDueTime = this._due;
        if (dateTime === null) {
            this._due = null;
            return;
        } 
        try {
            const converted = dateTimeHelper(dateTime);
            this._due = converted;
            if (originalDueTime === null) {
                this.setDueDateAndTimeStringsUnderEdit();
            }
        }
        catch (e) {
            addAlert(document.getElementById(HOME_ID), 
            ERROR_ALERT, `Could not set task deadline: ${e}`);
        }
    }
    /**
     * The due date as a Luxon DateTime
     * @param
     */
    get due () { return this._due; }
    get showDueTime () {return this._showDueTime; }
    set showDueTime (val) {
        this._showDueTime = val;
        if (val === false && this.due) {
            this.due = this.due.endOf("day");
            this.saveEdits("due");
        }
    }

    setDueDateAndTimeStringsUnderEdit() {
        this._dueDateStringUnderEdit = this.due ? PARTIAL_DATETIME_FORMATS.D.serializer(this.due) : "";
        this._dueTimeStringUnderEdit = this.due ? PARTIAL_DATETIME_FORMATS.t.serializer(this.due) : "";
    }

    /**
     * Set the date portion of the DateTime as a string. 
     * It does not need to be valid. If it is invalid, validation errors will be generated.
     * If it is parseable with the time, update the actual Due 
     * DateTime. 
     * @param dateString The string the user submitted for the date portion.
     */
    set dueDateStringUnderEdit (dateString : string) {
        this._dueDateStringUnderEdit = dateString;
        if (dateString === "") {
            this._due = null;
            return;
        }
        if (this.validationErrors.dueDateStringUnderEdit.length === 0) {
            const newDate = DATETIME_FORMATS.D_t.deserializer(dateString, 
                this.due ? PARTIAL_DATETIME_FORMATS.t.serializer(this.due) : this.dueTimeStringUnderEdit);
            if (!newDate.invalid) {
                // If the date generated using the time part of the current due datetime and the 
                // date string under edit is valid, update underlying due datetime
                this._due = newDate;
            }
        }
    }
    get dueDateStringUnderEdit () { return this._dueDateStringUnderEdit; }
    /**
     * Set the time portion of the DateTime as a string. 
     * It does not need to be valid. If it is invalid, validation errors will be generated.
     * If it is parseable with the date, update the actual Due 
     * DateTime. 
     * @param timeString The string the user submitted for the time portion.
     */
    set dueTimeStringUnderEdit (timeString : string) { 
        this._dueTimeStringUnderEdit = timeString;
        if (this.validationErrors.dueTimeStringUnderEdit.length === 0) {
            const newDate = DATETIME_FORMATS.D_t.deserializer(
                this.due ? PARTIAL_DATETIME_FORMATS.D.serializer(this.due) : this.dueDateStringUnderEdit,
                timeString);
            if (!newDate.invalid) {
                // If the date generated using the date part of the current due datetime and the 
                // time string under edit is valid, update underlying due datetime
                this._due = newDate;
            }
        }
    }
    get dueTimeStringUnderEdit () { return this._dueTimeStringUnderEdit; }

    /**
     * @returns if this task is overdue at the moment this method
     * is called
     */
    overdue () {
        return this.due ? this.due < DateTime.now() && !this.complete : false;
    }
//#endregion
//#region color
    /** The color of this task as a hex code string */
    get color () { return this._color; }
    /**
     * Set the color of the task to a hex code string
     */
    set color (color : string) {
        const errors = this.getValidationErrorsForField({field: "color", paramsForTestMethod: {color}});
        if (!errors.length) {
            this._color = color;
        }
    }
//#endregion
//#region autoSave
    /**
     * Internal method to sync all of this tasks fields with its DB model
     */
    patchToServer (field?: EditableTaskFields) {
        let update;
        if (field) {
            switch (field) {
                case "title":
                    update = {title: this.title};
                    break;
                case "complete":
                    update = {complete: this.complete};
                    break;
                case "start":
                    update = {start: this.start};
                    break;
                case "showStartTime":
                    update = {show_start_time: this.showStartTime};
                    break;
                case "due":
                    update = {due: this.due};
                    break;
                case "showDueTime":
                    update = {show_due_time: this.showDueTime};
                    break;
                case "description":
                    update = {description: this.description};
                    break;
                case "color":
                    update = {color: this.color};
                    break;
            }
        } else {
            update = this.json;
        }
        if (this._store) {
            return this._store.API.updateTask(this.id, update).then(
                result => result,
                reason => {
                    addAlert(document.getElementById(HOME_ID), 
                    ERROR_ALERT, 
                    `Task could not be updated - ${getLegibleErrors(reason.response.data)}`);
                    // Revert changes
                    this._store.loadTasks({refresh: true});
                }
            );
        }
    }

    /**
     * Turn on autosave for this task for future changes and 
     * patch fields to the server
     */
    saveEdits (field?: EditableTaskFields) {
        // If has been initialized and this is not a task not yet posted to the server
        if (this._store && !this.isNewAndUnsubmitted) {
            this.autoSave = true;
            return this.patchToServer(field);
        }
    }

    /**
     * Revert any strings under edit to their original states. 
     */
    abortEdits (field?: EditableTaskFields) {
        // If has been initialized and this is not a task not yet posted to the server
        switch (field) {
            case "start":
                this.setStartDateAndTimeStringsUnderEdit();
                break;
            case "due":
                this.setDueDateAndTimeStringsUnderEdit();
                break;
            case "color":
                this.colorStringUnderEdit = this.color;
                break;
            default:
                this.colorStringUnderEdit = this._color;
                this.setStartDateAndTimeStringsUnderEdit();
                this.setDueDateAndTimeStringsUnderEdit();
                break;
        }
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
            start: this.start ? this.start.toJSON() : undefined, 
            due: this.due ? this.due.toJSON() : undefined,
            description: this.description,
            color: this.color,
        };
    } 
    /**
     * Update this TaskModel with info pulled from a passed JSON
     * @param {object} json 
     */
    set json(json : {[index : string]: any}) {
        this.autoSave = false;
        this._id = json.id;
        this.title = json.title;
        this.description = json.description;
        this.start = json.start;
        this.showStartTime = json.show_due_time;
        this.due = json.due;
        this.showDueTime = json.show_due_time;
        this.complete = json.complete
        this._createdDate = dateTimeHelper(json.created_at);
        this.color = json.color;
        this.autoSave = true;
    }

//#endregion JSON
//#region NEW TASK CREATION
    get isNewAndUnsubmitted() {
        return this._store ? this._store.taskBeingCreated === this : true;
    }

    /**
     * Mark a task being created as "finished" and save the task to the server
     * if changes are valid.
     */
    async submitNewTask ()  : Promise<AxiosResponse> {
        // Validate that there are no errors. If there are, raise an alert.
        if (!this.isValid) {
            const msg = `Task could not be saved, it still has errors - ${getLegibleErrors(this.validationErrors)}`;
            addAlert(document.querySelector('.new-wrapper'), 
                ERROR_ALERT, 
                msg
            );
            return (new Promise((resolve, reject) => reject(msg)));
        }
        if (!this._store) {
            const msg = `Task could not be saved, there is no associated TaskStore to communicate with a server`;
            addAlert(document.querySelector('.new-wrapper'), 
                ERROR_ALERT, 
                msg
            );
            return (new Promise((resolve, reject) => reject(msg)));
        }
        
        // Post to server
        return this._store.API.createTask(this.json).then(
            (value) => {
                if (this._store) {
                    this._store.setNewTask(null);
                }
                return value;
            },
            (reason) => {
                addAlert(
                    document.getElementById(HOME_ID), 
                    ERROR_ALERT, 
                    `Could not add task - ${getLegibleErrors(reason.response.data.errors)}`
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
        if (this._store) {
            this._store.setNewTask(null);
            this._store.remove(this);
        }
    }

    /**
     * Set the string value that the user entered as they're editing the color. 
     * It does not need to be valid, if it is not, validation errors will be generated.
     * If it is valid, update the actual color used as well.
     * 
     * @param input The hex code with the # included at the front. Should accept
     * 3 and 6 digit codes 
     */
    set colorStringUnderEdit (input : string) { 
        this._colorStringUnderEdit = input.trim();
        this.color = this._colorStringUnderEdit;
    };

    get colorStringUnderEdit (): string { return this._colorStringUnderEdit; };

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
                fail: ({color}: {color: string}) => !(/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)),
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
                    text: this.start && this.start.invalid ? this.start.invalid.explanation : "",
                    fail: ({start=this.start}) => start && !start.isValid,
                },
            ],
            due: [
                {
                    text: this.due && this.due.invalid ? this.due.invalid.explanation : "",
                    fail: ({due=this.due}) => due && !due.isValid,
                },
            ],
            workInterval: [
                {
                    text: `Start time must come before due time`,
                    fail: ({start=this.start, due=this.due}) => start && due && start >= due && start.hasSame(due, 'day'),
                },
                {
                    text: `Start must come before due`,
                    fail: ({start=this.start, due=this.due}) => start && due && start >= due && !start.hasSame(due, 'day'),
                },
            ],
            color: [
                {
                    text: reUsedTests.validHexCode.text,
                    fail: ({color=this.color}) => reUsedTests.validHexCode.fail({color: color}),
                }
            ],
            colorStringUnderEdit: [
                {
                    text: reUsedTests.validHexCode.text,
                    fail: ({color=this.colorStringUnderEdit}) => reUsedTests.validHexCode.fail({color: color}),
                }
            ],
            startTimeStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_TIME_FORMAT,
                    fail: ({timeString=this.startTimeStringUnderEdit}) => timeString !== "" && !PARTIAL_DATETIME_FORMATS.t.deserializer(timeString).isValid,
                },
            ],
            startDateStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_DATE_FORMAT,
                    fail: ({dateString=this.startDateStringUnderEdit}) => dateString !== "" && !PARTIAL_DATETIME_FORMATS.D.deserializer(dateString).isValid,
                },
            ],
            dueTimeStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_TIME_FORMAT,
                    fail: ({timeString=this.dueTimeStringUnderEdit}) => timeString !== "" && !PARTIAL_DATETIME_FORMATS.t.deserializer(timeString).isValid,
                },
            ],
            dueDateStringUnderEdit: [
                {
                    text: reUsedErrorMessages.INVALID_DATE_FORMAT,
                    fail: ({dateString=this.dueDateStringUnderEdit}) => dateString !== "" && !PARTIAL_DATETIME_FORMATS.D.deserializer(dateString).isValid,
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

export module TaskModel.VisualStyles {
    export const Start =  "start";
    export const Due = "due";
    export const Scheduled = "scheduled";
    export type AcceptedStyles = "start" | "due" | "scheduled";
}

export const TaskContext: Context<TaskModel> | Context<null> = createContext(null);