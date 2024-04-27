import { makeAutoObservable, runInAction} from "mobx";
import TaskModel from "./TaskModel";
import { DateTime } from "luxon";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT, NOTICE_ALERT, updateAlertText } from '@/alerts/alertEvent';
import { TaskApi } from "@/home/API/TaskApi";
import  RootStore from '@/store/RootStore';
import EditTaskModel from "../../dashboard/widgets/NewTask/EditTaskModel";

export default class TaskStore {
// !!! Fields must have defaults set here to be observable. 
    static taskStoreSingletonInstance : TaskStore;
    API : TaskApi;
    rootStore : RootStore;
    timeline;
    taskSet : Set<TaskModel> = new Set<TaskModel>();
    // Task to show details for
    taskBeingFocused : TaskModel | null = null;
    // Task : TODO: Move this to static EditTaskModel
    taskBeingEdited : EditTaskModel | null = null;
    // Boolean : Whether the store has synced with server
    isLoaded : boolean = false;

    /**
     * The store which holds object representations of tasks currently in the DB, or that will be added.
     * 
     * @param {*} rootStore The store that holds this instance.
     * @param {*} API The API module used to make network calls to the task API.
     */
    constructor (rootStore : RootStore, API : TaskApi) {
        makeAutoObservable(this, {
            API: false,
            rootStore: false,
            isLoaded: true
        }, {proxy: false})
        this.rootStore = rootStore;
        if (TaskStore.taskStoreSingletonInstance !== undefined) {
            throw new Error("You cannot create two TaskStores, access the global TaskStore with TaskStore.taskStoreSingletonInstance")
        }
        TaskStore.taskStoreSingletonInstance = this;
        this.timeline = this.rootStore.eventStore;
        this.API = API;
        this.taskSet = new Set<TaskModel>();
        this.loadTasks();
        this.taskBeingFocused = null;
        this.taskBeingEdited = null;
    }

    /**
     * Fetch all tasks from the server and add them to the store. If the request fails, generate an alert and repeatedly retry.
     * 
     * @param {*} retry The number of times this call has been retried.
     * @returns 
     */
    async loadTasks (retry:number=0, connectionAlertIdselectorForFieldElementstring="") {
        this.isLoaded = false;
        return this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach((json : object )=> new TaskModel(json));
                this.isLoaded = true;
                if (retry !== 0) {
                    Array.from(document.getElementsByClassName(ERROR_ALERT)).forEach(ele => {
                        ele.querySelector('button').click()})
                    addAlert(document.querySelector("#home-wrapper"), SUCCESS_ALERT, "Re-established connection");
                }
            });
        }).catch(e => {
            if (retry === 0) {
                connectionAlertIdSelector = addAlert(document.querySelector("#home-wrapper"), ERROR_ALERT, `Could not load tasks - ${e}`);
                console.error(e);
            }
            else if (connectionAlertIdSelector) {
                updateAlertText(connectionAlertIdSelector, `Could not load tasks - ${e} - Retry #${retry+1}`)
            }
            setTimeout(() => {this.loadTasks(retry + 1, connectionAlertIdSelector)}, 3000);
        })
    }

    tasksInRange (startTime : DateTime, endTime : DateTime) {
        return this.tasks.filter(task => (task.start <= endTime && task.start >= startTime) || (task.due <= endTime && task.due >= startTime));
    }

    get tasks () {
        return Array.from(this.taskSet);
    }

    /**
     * Specify the task that details should be shown for (show task popup).
     * @param {TaskModel} task Task that details should be shown for
     */
    setFocus (task : TaskModel) {
        this.taskBeingFocused = task;
    }
    
    setEditing(task : EditTaskModel | null) {
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
    add (taskObj : TaskModel) {
        this.taskSet.add(taskObj);
    } 

    remove (task: TaskModel) {
        this.taskSet.delete(task);
    }

    delete (task: TaskModel) {
        this.API.deleteTask(task.id)
        .then(() => {
            this.remove(task);
            addAlert(document.getElementById('home-wrapper'), 
            NOTICE_ALERT, `Deleted "${task.title}"`);
        })
        .catch(error => {
            addAlert(document.getElementById('home-wrapper'), 
            ERROR_ALERT, `${task.title} could not be deleted - ${error.toString()}`);
            this.add(task);
        });
    }
}