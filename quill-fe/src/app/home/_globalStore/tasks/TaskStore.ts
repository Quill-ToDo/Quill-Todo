import { makeObservable, observable, action, computed, runInAction} from "mobx";
import { TaskModel } from "./TaskModel";
import { DateTime } from "luxon";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT, NOTICE_ALERT, updateAlertText } from '@/alerts/alertEvent';
import { TaskApi } from "@/store/tasks/TaskApi";
import  RootStore from '@/store/RootStore';
import EditTaskModel from "@/widgets/NewTask/EditTaskModel";

export type TaskDataOnDay = {
    start: TaskModel[];
    due: TaskModel[];
    scheduled: TaskModel[];
};

export type Timeline = Map<DateTime, TaskDataOnDay>;

export default class TaskStore {
// !!! Fields must have defaults set here to be observable. 
    static taskStoreSingletonInstance : TaskStore;
    API : TaskApi;
    rootStore : RootStore;
    taskSet : Set<TaskModel> = new Set<TaskModel>();
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
    constructor ({rootStore, API}: {rootStore : RootStore, API : TaskApi}) {
        makeObservable(this, {
            // Do not observe
            API: false,
            rootStore: false,
            tasksInRange: false,
            // Observables
            isLoaded: observable,
            taskSet: observable,
            taskBeingEdited: observable,
            // Computeds
            tasks: computed,
            taskTimeline: computed,
            // Actions
            loadTasks: false,
            setEditing: action,
            add: action,
            remove: action, 
            delete: action,
        }, {proxy: false})
        this.rootStore = rootStore;
        if (TaskStore.taskStoreSingletonInstance !== undefined) {
            throw new Error("You cannot create two TaskStores, access the global TaskStore with TaskStore.taskStoreSingletonInstance")
        }
        TaskStore.taskStoreSingletonInstance = this;
        this.API = API;
        this.taskSet = new Set<TaskModel>();
        this.loadTasks();
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
                connectionAlertIdselectorForFieldElementstring = addAlert(document.querySelector("#home-wrapper"), ERROR_ALERT, `Could not load tasks - ${e}`);
                console.error(e);
            }
            else if (connectionAlertIdselectorForFieldElementstring) {
                updateAlertText(connectionAlertIdselectorForFieldElementstring, `Could not load tasks - ${e} - Retry #${retry+1}`)
            }
            setTimeout(() => {this.loadTasks(retry + 1, connectionAlertIdselectorForFieldElementstring)}, 3000);
        })
    }

    
    get tasks () {
        return Array.from(this.taskSet);
    }
    
    tasksInRange ({startTime, endTime}: {startTime : DateTime, endTime : DateTime}) {
        return this.tasks.filter(task => (task.start <= endTime && task.start >= startTime) || (task.due <= endTime && task.due >= startTime));
    }

    get taskTimeline () {
        const timeline: Timeline = new Map();
        let dayKey: string, firstDayInRange: DateTime, lastDayInRange: DateTime, tasksThisDay; 
        this.tasks.forEach(task => {
            firstDayInRange = task.start.startOf('day');
            lastDayInRange = task.due.endOf('day');
            for (let dayItr = firstDayInRange.startOf('day'); dayItr <= lastDayInRange.endOf('day'); dayItr = dayItr.plus({days:1})) {
                dayKey = dayItr.toLocaleString(DateTime.DATE_SHORT);
                if (!timeline.has(dayKey)) { 
                    timeline.set(dayKey, 
                        {
                            start: [],
                            due: [],
                            scheduled: [],
                        })
                }
                tasksThisDay = timeline.get(dayKey);
                if (tasksThisDay) {
                    if (dayItr.hasSame(lastDayInRange, 'day')) {
                        tasksThisDay.due.push(task);
                    }
                    if (dayItr.hasSame(firstDayInRange, 'day')) {
                        tasksThisDay.start.push(task);
                    }
                    if (!dayItr.hasSame(lastDayInRange, 'day') && !dayItr.hasSame(firstDayInRange, 'day')) {
                       tasksThisDay.scheduled.push(task);
                    }
                }
            }
        });
        return timeline;
    }
    
    setEditing(task : EditTaskModel | null) {
        this.taskBeingEdited = task;
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