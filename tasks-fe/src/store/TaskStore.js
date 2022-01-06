import { makeAutoObservable, runInAction} from "mobx";
import { Task } from "./Task";
import { DateTime } from "luxon";

export class TaskStore {
    API;
    rootStore;
    // userStore
    // These must have a default value here to be observable
    tasks = [];
    // Task to show details for
    focusedTask = null;
    isLoaded = false;

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
        this.focusedTask = null;
    }

    // Fetch all tasks from server
    loadTasks (retry=0) {
        this.isLoaded = false;
        this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach(json => this.updateTaskFromServer(json));
                this.isLoaded = true;
            });
        }).catch(e => {
            console.log(e)
            this.rootStore.alertStore.add("failure", "Could not load tasks - " + e);
            if (retry < 5) {
                this.loadTasks(retry+1);
            }
        })
    }

    // Update a todo with into from a server and guarantee it only exists once
    updateTaskFromServer (taskJson) {
        let task = this.tasks.find(t => t.pk === taskJson.pk)
        if (!task) {
            // Does not yet exist in store
            task = new Task(this, taskJson.pk);
            this.tasks.push(task);
        }
        task.updateFromJson(taskJson);
    } 

    byStatus() {
        const now = DateTime.now();
        return {
            "overdue": this.tasks.filter(task => DateTime.fromISO(task.due) <= now),
            "todayDue": this.tasks.filter(task => (DateTime.fromISO(task.due) <= now.set({hour: 23, minute: 59, second: 59})) && (now < DateTime.fromISO(task.due))),
            "todayWork": this.tasks.filter(task => (task.start && DateTime.fromISO(task.start) <= now) && (now <= DateTime.fromISO(task.due))),
            "upcoming": this.tasks.filter(task => (!task.start || now <= DateTime.fromISO(task.start) ) && (now.set({hour: 23, minute: 59, second: 59}) < DateTime.fromISO(task.due)))
        }
    }

    // Specify which task is selected to show the details of
    setFocus (task) {
        this.focusedTask = task;
    }
    
    // Specify that no task is being shown
    removeFocus () {
        this.focusedTask = null;
    }

    // createTask (taskData) {
    //     // Create on server, get pk
    //     // let task = new Task(this, pk);
    //     // task.updateFromJson(json);
    //     // this.tasks[pk] = task;
    // }
}