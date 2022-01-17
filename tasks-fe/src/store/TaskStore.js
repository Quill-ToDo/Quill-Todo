import { makeAutoObservable, runInAction} from "mobx";
import { Task } from "./Task";
import { DateTime } from "luxon";
import { v4 } from "uuid";

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
    async loadTasks (retry=0) {
        this.isLoaded = false;
        return this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach(json => this.updateTaskFromServer(json));
                this.isLoaded = true;
                if (retry !== 0) {
                    Array.from(document.getElementsByClassName("failure")).forEach(ele => {
                        ele.querySelector('button').click()})
                    this.rootStore.alertStore.add("success", "Re-established connection");
                }
            });
        }).catch(e => {
            if (retry === 0) {
                this.rootStore.alertStore.add("failure", "Could not load tasks - " + e);
            }
            setTimeout(() => {this.loadTasks(retry + 1)}, 3000);
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


    timeOccursBeforeEOD (time, currentTime) {
        return (DateTime.fromISO(time) <= currentTime.set({hour: 23, minute: 59, second: 59}))
    }

    timeOccursBetweenNowAndEOD (time, currentTime) {
        return (this.timeOccursBeforeEOD(time, currentTime) && (currentTime < DateTime.fromISO(time)))
    }

    byStatus() {
        const now = DateTime.now();
        return {
            "overdue": this.tasks.filter(task => DateTime.fromISO(task.due) <= now),
            "todayDue": this.tasks.filter(task => (this.timeOccursBetweenNowAndEOD(task.due, now))),
            "todayWork": this.tasks.filter(task => 
                (task.start && DateTime.fromISO(task.start) <= now) 
                && (now < DateTime.fromISO(task.due))
                && !(this.timeOccursBetweenNowAndEOD(task.due, now))
                ),
            "upcoming": this.tasks.filter(task => 
                (!task.start || now <= DateTime.fromISO(task.start)) && !(this.timeOccursBeforeEOD(task.due, now))
                )
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

    add(taskObj) {
        this.tasks.push(taskObj);
    } 

    /**
     * This method assumes the task has already been checked for validity on the FE, does not render error messages
     * 
     * @param {*} taskData 
     */
    createTask (taskData) {
        // Method 1:
        // Create on server, get pk
        // let task = new Task(this, pk);
        // task.updateFromJson(json);
        // this.tasks[pk] = task;
        // Method 2: UUID
        // Generate UUID, add task to store.
        // Pass task to BE, render alert and remove from taskStore if it could not be posted
        const task = new Task(this, v4()); 
        const data = taskData;
        data.complete = false;
        console.log(data);
        task.updateFromJson(data);
        this.add(task);
        this.API.createTask(data).catch(e => {
            console.log(e.response.data.errors)
            this.rootStore.alertStore.add("failure", "Could not add task - " + e.response.errors);
            this.tasks.remove(task);
        });
    }
}