import { makeAutoObservable, runInAction} from "mobx";
import  TaskModel  from "./TaskModel.js";
import { DateTime } from "luxon";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT } from '../Alerts/alertEvent.js';
import { timeOccursBeforeEOD, timeOccursBetweenNowAndEOD } from "./DateTimeHelper.js";

export default class TaskStore {
// !!! Fields must have defaults set here to be observable. 
    API;
    // RootStore
    rootStore;
    // Array<Tasks>
    tasks = [];
    // Task : Task to show details for
    taskBeingFocused = null;
    // Task : TODO: Move this to static EditTaskModel
    taskBeingEdited = null;
    // Boolean : Whether the store has synced with server
    isLoaded = false;

    /**
     * The store which holds object representations of tasks currently in the DB, or that will be added.
     * 
     * @param {*} rootStore The store that holds this instance.
     * @param {*} API The API module used to make network calls to the task API.
     */
    constructor (rootStore, API) {
        makeAutoObservable(this, {
            API: false,
            rootStore: false,
            isLoaded: true
        }, {proxy: false})
        this.rootStore = rootStore;
        this.API = API;
        this.tasks = [];
        this.loadTasks();
        this.taskBeingFocused = null;
    }

    /**
     * Fetch all tasks from the server and add them to the store. If the request fails, generate an alert and repeatedly retry.
     * 
     * @param {*} retry The number of times this call has been retried.
     * @returns 
     */
    async loadTasks (retry=0) {
        this.isLoaded = false;
        return this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach(json => new TaskModel(this, json));
                this.isLoaded = true;
                if (retry !== 0) {
                    Array.from(document.getElementsByClassName(ERROR_ALERT)).forEach(ele => {
                        ele.querySelector('button').click()})
                    addAlert(document.querySelector("#home-wrapper"), SUCCESS_ALERT, "Re-established connection");
                }
            });
        }).catch(e => {
            if (retry === 0) {
                addAlert(document.querySelector("#home-wrapper"), ERROR_ALERT, "Could not load tasks - " + e);
                console.error(e);
            }
            setTimeout(() => {this.loadTasks(retry + 1)}, 3000);
        })
    }

    /**
     * Get tasks grouped by statuses: overdue, todayDue, todayWork, and upcoming. These are disjoint sets.
     */
    get byStatus() {
        const now = DateTime.now();

        return {
            "overdue": this.tasks.filter(task => task.due <= now),
            "todayDue": this.tasks.filter(task => timeOccursBetweenNowAndEOD(task.due)),
            "todayWork": this.tasks.filter(task => 
                (task.start && task.start <= now) 
                && (now < task.due)
                && !(timeOccursBetweenNowAndEOD(task.due))
                ),
            "upcoming": this.tasks.filter(task => 
                (!task.start || now <= task.start) && !(timeOccursBeforeEOD(task.due))
                )
        }
    }

    /**
     * Get tasks ordered by due date
     */
    // get allTasks() {
        // return this.tasks.sort();
    // }

    /**
     * Specify the task that details should be shown for (show task popup).
     * @param {TaskModel} task Task that details should be shown for
     */
    setFocus (task) {
        this.taskBeingFocused = task;
    }
    
    setEditing(task) {
        this.taskBeingEdited = task;
    }

    /**
     * Specify that no task should have its details shown in a popup.
     */
    removeFocus () {
        this.taskBeingFocused = null;
    }

    /**
     * @param {TaskModel} taskObj Task that should be added to the store. 
     */
    add(taskObj) {
        this.tasks.push(taskObj);
    } 

}