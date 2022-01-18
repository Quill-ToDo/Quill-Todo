import { makeAutoObservable, reaction } from "mobx"
import { v4 } from "uuid";

export class Task {
    id = null;
    title = "";
    complete = null;
    start = null;
    due = null;
    description = "";
    store = null;

    constructor (store, id = v4()) {
        makeAutoObservable(this, {
            id: false,
            store: false,
            saveHandler: false,
        }, {proxy: false});
        // Could do validations here too if I wanted...
        this.store = store;
        this.id = id;

        this.saveHandler = reaction(
            () => this.asJson, // Observe everything used in the JSON
            json => {
                // If autosave is true, send JSON to update server
                if (this.autoSave) {
                    this.store.API.updateTask(this.id, json)
                    .catch(error => {
                        this.store.rootStore.alertStore.add("failure", 
                            "Task could not be updated - " + error.toString());
                        // Revert changes
                        this.store.loadTasks();
                    });
                }
            });
    }

    delete() {
        this.store.tasks.remove(this);
        this.store.API.deleteTask(this.id)
        .then(() => {
            this.store.rootStore.alertStore.add("notice", "Task deleted")
        })
        .catch(error => {
            this.store.rootStore.alertStore.add("failure", 
                "Task could not be deleted - " + error.toString());
            this.store.add(this);
        });
    }

    get asJson() {
        return {
            id: this.id,
            title: this.title,
            complete: this.complete,
            start: this.start, 
            due: this.due,
            description: this.description
        };
    }

    toggleComplete () {
        this.complete = !this.complete;
    }

    // Update todo with info from server
    updateFromJson(json) {
        this.autoSave = false;
        // Prevent sending these changes back to the server
        this.title = json.title === "" ? null : json.title;
        this.complete = json.complete === "" ? null : json.complete;
        this.start = json.start === "" ? null : json.start;
        this.due = json.due === "" ? null : json.due;
        this.description = json.description === "" ? null : json.description;
        this.autoSave = true;
    }

    /**
     * Mark this task as the one that details should be rendered for
     */
    setFocus() {
        this.store.setFocus(this);
    }
}