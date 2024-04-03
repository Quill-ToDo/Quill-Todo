import { TaskApi } from "../API/TaskApi.js";
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
        this.taskStore = new TaskStore(this, new TaskApi());
        this.eventStore = new EventStore(this, this.taskStore);
    };
}