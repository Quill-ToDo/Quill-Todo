import { makeObservable, observable, action, computed, runInAction} from "mobx";
import { TaskModel } from "./TaskModel";
import { DateTime } from "luxon";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT, NOTICE_ALERT, updateAlertText } from '@/alerts/alertEvent';
import { TaskApi } from "@/store/tasks/TaskApi";
import  RootStore from '@/store/RootStore';

export type TaskDataOnDay =  {
    task: TaskModel, 
    type: TaskModel.VisualStyles.AcceptedStyles}[];

export type Timeline = Map<DateTime, TaskDataOnDay>;

export default class TaskStore {
// !!! Fields must have defaults set here to be observable. 
    static taskStoreSingletonInstance : TaskStore;
    API : TaskApi;
    rootStore : RootStore;
    taskSet : Set<TaskModel> = new Set();
    // The singleton task currenbtly being created, has not synced to server
    taskBeingCreated : TaskModel | null = null;
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
            taskBeingCreated: observable,
            // Computeds
            tasks: computed,
            taskMap: computed,
            taskTimeline: computed,
            // Actions
            createNewTask: action,
            setNewTask: action,
            add: action,
            remove: action, 
            delete: action,
            getTaskWithId: false,
            loadTasks: false,
        }, {proxy: false})
        this.rootStore = rootStore;
        if (TaskStore.taskStoreSingletonInstance !== undefined) {
            throw new Error("You cannot create two TaskStores, access the global TaskStore with TaskStore.taskStoreSingletonInstance")
        }
        TaskStore.taskStoreSingletonInstance = this;
        this.API = API;
        this.taskSet = new Set<TaskModel>();
        this.loadTasks({});
        this.taskBeingCreated = null;
    }

    /**
     * Fetch all tasks from the server and add them to the store. If the request fails, generate an alert and repeatedly retry.
     * 
     * @param {*} retry The number of times this call has been retried.
     * @returns 
     */
    async loadTasks (
        {
            retry=0,
            connectionAlertIdselectorForFieldElementstring,
            refresh=false,
        } : {
            retry?: number, 
            connectionAlertIdselectorForFieldElementstring?: string, 
            refresh?: boolean}) {
        this.isLoaded = false;
        return this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach((json : {[index : string]: any}) => {
                    if (refresh && this.taskMap && this.taskMap.has(json.id)) {
                        let task = this.getTaskWithId(json.id); 
                        if (task) { 
                            task.json = json;
                        }
                    }
                    else {
                        new TaskModel(json);
                    }
                });
                this.isLoaded = true;
                if (retry !== 0) {
                    Array.from(document.getElementsByClassName(ERROR_ALERT)).forEach(ele => {
                        ele.querySelector('button').click()})
                    addAlert(document.querySelector("#home-wrapper"), SUCCESS_ALERT, "Re-established connection");
                }
                if (refresh) {
                    addAlert(document.querySelector("#home-wrapper"), SUCCESS_ALERT, "Reset all tasks to previous state");
                }
            });
        }).catch(e => {
            let error = `Could not load tasks: ${e.message}`;
            if (retry === 0) {
                connectionAlertIdselectorForFieldElementstring = addAlert(document.querySelector("#home-wrapper"), ERROR_ALERT, error);
                console.error(e);
            }
            else if (connectionAlertIdselectorForFieldElementstring) {
                updateAlertText(connectionAlertIdselectorForFieldElementstring, `${error}. Retry #${retry+1}`)
            }
            setTimeout(() => {this.loadTasks({retry: retry + 1, connectionAlertIdselectorForFieldElementstring: connectionAlertIdselectorForFieldElementstring})}, 3000);
        })
    }

    
    get tasks () {
        return Array.from(this.taskSet);
    }
    
    get taskMap (): Map<string, TaskModel> {
        let map: Map<string, TaskModel> = new Map();
        this.tasks.forEach((task) => {
            map.set(task.id, task);
        });
        return map;
        
    }

    getTaskWithId = (id: string) => {
        return this.taskMap.get(id);
    }
    
    tasksInRange ({startTime, endTime}: {startTime : DateTime, endTime : DateTime}) {
        return this.tasks.filter(task => (task.start <= endTime && task.start >= startTime) || (task.due <= endTime && task.due >= startTime));
    }

    get taskTimeline () {
        const timeline: Timeline = new Map();
        let dayKey: string, firstDayInRange: DateTime, lastDayInRange: DateTime, tasksThisDay; 
        this.tasks.forEach(task => {
            firstDayInRange = task.start.startOf('day').minus({days: 1});
            lastDayInRange = task.due.endOf('day');
            for (let dayItr = firstDayInRange; dayItr <= lastDayInRange; dayItr = dayItr.plus({days:1})) {
                dayKey = dayItr.toLocaleString(DateTime.DATE_SHORT);
                if (!timeline.has(dayKey)) { 
                    timeline.set(dayKey, [])
                }
                tasksThisDay = timeline.get(dayKey);
                if (tasksThisDay) {
                    if (dayItr.hasSame(lastDayInRange, 'day')) {
                        tasksThisDay.push({task: task, type: TaskModel.VisualStyles.Due});
                    }
                    else if (dayItr.hasSame(firstDayInRange, 'day')) {
                        tasksThisDay.push({task: task, type: TaskModel.VisualStyles.Start});
                    }
                    else {
                        tasksThisDay.push({task: task, type: TaskModel.VisualStyles.Scheduled});
                    }
                }
            }
        });
        return timeline;
    }
    
    createNewTask () : TaskModel {
        if (this.taskBeingCreated) {
            // If a new task is already being added, return focus to it
            // until it's intentionally disgarded
            const popup = document.getElementById("new-wrapper");
            if (!popup) { return this.taskBeingCreated; }
            const firstInput = popup.querySelector("input");
            firstInput && firstInput.focus();
            return this.taskBeingCreated;
        } 
        else {
            const taskBeingCreated = new TaskModel();
            this.setNewTask(taskBeingCreated);
            this.add(taskBeingCreated);
            return taskBeingCreated;
        }
    } 

    /**
     * Set the task passed as "being created". Only one task can be 
     * in this state at a time. Updates to the task model will not 
     * be saved to the server, but changes will be synchronized in the UI 
     * through the TaskStore. 
     * To sync changes to server, call `task.submitNewTask` or abort 
     * changes with `task.abortTaskCreation`.
     */
    setNewTask (task : TaskModel | null) {
        this.taskBeingCreated = task;
        if (task) {
            task.autoSave = false;
        };
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