import { makeAutoObservable, runInAction} from "mobx";
import { Task } from "./Task";
import { DateTime } from "luxon";
import { END_OF_DAY } from "constants.js";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT, updateAlertText } from '@/alerts';

export class TaskStore {
    API;
    rootStore;
    timeline;
    // userStore
    // These must have a default value here to be observable
    tasks = [];
    // Task to show details for
    taskBeingFocused = null;
    taskBeingEdited = null;
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
        this.timeline = this.rootStore.timeline;
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
    async loadTasks (retry=0, connectionAlertId="") {
        this.isLoaded = false;
        return this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach(json => this.updateTaskFromServer(json));
                this.isLoaded = true;
                if (retry !== 0) {
                    Array.from(document.getElementsByClassName(ERROR_ALERT)).forEach(ele => {
                        ele.querySelector('button').click()})
                    addAlert(document.querySelector("#home-wrapper"), SUCCESS_ALERT, "Re-established connection");
                }
            });
        }).catch(e => {
            if (retry === 0) {
                connectionAlertId = addAlert(document.querySelector("#home-wrapper"), ERROR_ALERT, `Could not load tasks - ${e}`);
                console.error(e);
            }
            else if (connectionAlertId) {
                updateAlertText(connectionAlertId, `Could not load tasks - ${e} - Retry #${retry+1}`)
            }
            setTimeout(() => {this.loadTasks(retry + 1, connectionAlertId)}, 3000);
        })
    }

    /**
     * Update one task with info and fields from the DB and guarantee that it only exists in the store once.
     * @param {object} taskJson Info about this task in JSON format.
     */
    updateTaskFromServer (taskJson) {
        let task = this.tasks.find(t => t.id === taskJson.id)
        if (!task) {
            // Does not yet exist in store
            task = new Task(this, taskJson.id);
            this.tasks.push(task);
        }
        task.updateFromJson(taskJson);
    } 

    /**
     * @param {DateTime} time The DT to check.
     * @returns true if the time occurs before the end of the current day, false otherwise.
     */
    timeOccursBeforeEOD (time) {
        return (time <= END_OF_DAY())
    }

    /**
     * 
     * @param {DateTime} time The DT to check.
     * @param {*} currentTime The current time. (now)
     * @returns true if time occurs between now and the end of the current day, false otherwise.
     */
    timeOccursBetweenNowAndEOD (time, currentTime) {
        return (this.timeOccursBeforeEOD(time) && (currentTime < time))
    }


    /**
     * Get tasks grouped by statuses: overdue, todayDue, todayWork, and upcoming. These are disjoint sets.
     */
    get byStatus() {
        const now = DateTime.now();

        return {
            "overdue": this.tasks.filter(task => task.due <= now),
            "todayDue": this.tasks.filter(task => this.timeOccursBetweenNowAndEOD(task.due, now)),
            "todayWork": this.tasks.filter(task => 
                (task.start && task.start <= now) 
                && (now < task.due)
                && !(this.timeOccursBetweenNowAndEOD(task.due, now))
                ),
            "upcoming": this.tasks.filter(task => 
                (!task.start || now <= task.start) && !(this.timeOccursBeforeEOD(task.due, now))
                )
        }
    }

    /**
     * Specify the task that details should be shown for (show task popup).
     * @param {Task} task Task that details should be shown for
     */
    setFocus (task) {
        this.taskBeingFocused = task;
    }
    
    /**
     * Specify that no task should have its details shown in a popup.
     */
    removeFocus () {
        this.taskBeingFocused = null;
    }

    /**
     * @param {Task} taskObj Task that should be added to the store. 
     */
    add(taskObj) {
        this.tasks.push(taskObj);
    } 

    /**
     * Create a new task marked as currently being edited. It will need to have
     * `finishEditing()` called on it to save it to the DB.
     * @param {object} options Pass an optional default `dueDate` or `startDate` or both in an object. Keys are symbols, values should be 
     * a Luxon DateTime or string in ISO format.
     */
    createInProgressTask ({dueDate=null, dueTime=null, startDate=null, startTime=null} = {}) {
        const task = new Task(this);
        if (dueDate) {
            task.setDue(dueDate);
        }
        if (startDate) {
            task.setStart(startDate);
        }
        task.startEditing(); 
        this.add(task);
        return task;
    }
}