import { TaskApi } from "./tasks/TaskApi";
import TaskStore from "./tasks/TaskStore";
import { EventStore } from "./events/EventStore";
import { configure } from "mobx"

configure({
    useProxies: "never"
})

export default class RootStore {
    taskStore : TaskStore;
    eventStore : EventStore;
    
    constructor () {
        this.taskStore = new TaskStore({rootStore: this, API: new TaskApi()});
        this.eventStore = new EventStore(this, this.taskStore);
    };
}