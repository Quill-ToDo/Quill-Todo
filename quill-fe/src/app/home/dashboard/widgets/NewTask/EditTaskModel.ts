import { action, makeObservable, observable, override } from "mobx"
import {  
    stringToDateTimeHelper,
    DATE_TIME_FORMATS,
} from "@/utilities/DateTimeHelper";
import TaskModel from "@/store/tasks/TaskModel";
import { addAlert, ERROR_ALERT } from "@/app/home/dashboard/widgets/Alerts/alertEvent";
import { DateTime } from "@eonasdan/tempus-dominus";

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
export default class EditTaskModel extends TaskModel {
//#region CLASS FIELDS AND CONSTRUCTOR 
    startTimeString : String = ""; 
    startDateString : String = "";
    dueTimeString : String = "";
    dueDateString : String = "";
    // static taskBeingEdited = null;

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
    constructor(taskToEdit : TaskModel | null=null) {
        super(taskToEdit === null ? taskToEdit : taskToEdit.json);

        makeObservable(this, {
            startDateString: observable,
            setStartDateString: action,
            startTimeString: observable,
            setStartTimeString: action,
            dueDateString: observable,
            setDueDateString: action,
            dueTimeString: observable,
            setDueTimeString: action,
            validationErrors: override, // A list of validation errors of this edited task.
            isValid: override, // The fields in this task are parseable and it is safe to 
            // update the parent TaskModel
            startEditing: action,
            finishEditing: action,
            abortEditing: action,

        });
        // Initialize all class fields not using setters
        this.startDateString = DATE_TIME_FORMATS().D.serializer(this.start);
        this.startTimeString = DATE_TIME_FORMATS().t.serializer(this.start);
        this.dueDateString = DATE_TIME_FORMATS().D.serializer(this.due);
        this.dueTimeString = DATE_TIME_FORMATS().t.serializer(this.due);
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
        this.dontSaveToServer();
        this.store.setEditing(this);
    }
    /**
     * Mark a task being edited as "done" and save the task to the DB
     * if changes are valid.
     */
    finishEditing () {
        // Validate that there are no errors. If there are, raise an alert.
        if (!this.isValid) {
            addAlert(document.querySelector('#new-wrapper'), 
            ERROR_ALERT, 
            `Task could not be saved, it still has errors - ${this.validationErrors.toJSON()}`);
            console.error(this.validationErrors);
            console.error(this);
            return;
        } 
        
        // Post to server
        this.store.API.createTask(this.json)
        .catch(e => {
            console.error(e)
            addAlert(document.querySelector('#home-wrapper'), 
            ERROR_ALERT, 
            `Could not add task - ${e}`);            
            this.store.remove(this);
        });

        this.store.setEditing(null);
        this.saveToServer();
    }
    /**
     * Abort any edit changes and delete task from the TaskStore.
     */
    abortEditing () {
        this.store.setEditing(null);
        if (!this.createdDate) {
            // TODO make sure this is removing
            this.store.remove(this);
        }
        else {
            // TODO 
        }
    }
//#endregion
//#region CLASS FIELD GETTERS AND SETTERS
    setStartDateString = (dateString : String)  =>  { 
        this.startDateString = dateString;
        this.setStart(`${dateString}, ${this.startTimeString}`);
    }
    /**
     * Set start time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If it is parseable, also update the start time of the task.
     * @param {String} timeString 
     */
    setStartTimeString = (timeString : String)  =>  { 
        this.startTimeString = timeString;
        if (this.validationErrors.startTimeString.length === 0 && this.validationErrors.start.length === 0) {
            this.setStart(`${this.startDateString}, ${timeString}`);
        }
    }
    /**
     * Set due date portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueDateString (dateString : String) {
        this.dueDateString = dateString;
        if (this.validationErrors.dueDateString.length === 0 && this.validationErrors.due.length === 0) {
            this.setDue(`${dateString}, ${this.dueTimeString}`);
        }
    }
    /**
     * Set due time portion as displayed in text box to input string. 
     * Doesn't have to be valid. If valid, also update the start time of the task.
     * @param {String} dateString 
     */
    setDueTimeString (timeString : String) { 
        this.dueTimeString = timeString;
        if (this.validationErrors.dueTimeString.length === 0 && this.validationErrors.due.length === 0) {
            this.setDue(`${this.dueDateString}, ${timeString}`);
        }
    }
//#endregion CLASS FIELD GETTERS AND SETTERS
//#region VALIDATION
    /**
     * Get any validation errors as strings for this task in an object with the symbols and values:
     * 
     */
    get validationErrors() {
        // Object to save error messages in
        type EditFieldsErrors = {
            [index : string] : string[];
            title: string[];
            description: string[];
            start: string[];
            startTimeString: string[];
            startDateString: string[];
            due: string[];
            dueTimeString: string[];
            dueDateString: string[];
            workInterval: string[];
        };
        const errors : EditFieldsErrors = {
            title: super.validationErrors.title,
            description: super.validationErrors.description, 
            start: super.validationErrors.start,
            startTimeString: [],
            startDateString: [],
            due: super.validationErrors.due,
            dueTimeString: [],
            dueDateString: [],
            workInterval: super.validationErrors.workInterval,
        };
        const VALIDATION_ERROR_MESSAGES = {
            INVALID_TIME_FORMAT: `Time is not of the format ${DATE_TIME_FORMATS().t.readable}. Ex: 10:30 am`,
            INVALID_DATE_FORMAT: `Date is not of the format ${DATE_TIME_FORMATS().D.readable}. Ex: 7/26/2022`,
            INVALID_DATETIME_FORMAT: `Date and time could not be parsed together.`,
        }
        const fieldsToValidate = {
            startTimeString: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_TIME_FORMAT,
                    fail: () => !DATE_TIME_FORMATS().t.deserializer(this.startTimeString).isValid,
                },
            ],
            startDateString: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_DATE_FORMAT,
                    fail: () => !DATE_TIME_FORMATS().D.deserializer(this.startDateString).isValid,
                },
            ],
            start: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_DATETIME_FORMAT,
                    fail: () => !stringToDateTimeHelper(`${this.startDateString}, ${this.startTimeString}`).isValid,
                }
            ],
            dueTimeString: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_TIME_FORMAT,
                    fail: () => !DATE_TIME_FORMATS().t.deserializer(this.dueTimeString).isValid,
                },
            ],
            dueDateString: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_DATE_FORMAT,
                    fail: () => !DATE_TIME_FORMATS().D.deserializer(this.dueDateString).isValid,
                },
            ],
            due: [
                {
                    text: VALIDATION_ERROR_MESSAGES.INVALID_DATETIME_FORMAT,
                    fail: () => !stringToDateTimeHelper(`${this.dueDateString}, ${this.dueTimeString}`).isValid,
                }
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