'use client'

import React from "react";
import { TaskApi } from "../API/TaskApi.js";
import { TaskStore } from "./tasks/TaskStore";
import { EventStore } from "./events/EventStore";
import { configure } from "mobx"

configure({
    useProxies: "never"
})


class RootStore {
    taskStore : TaskStore;
    eventStore : EventStore;
    
    constructor () {
        // this.userStore
        this.taskStore = new TaskStore(this, new TaskApi());
        this.eventStore = new EventStore(this, this.taskStore);
    };
}

let rootStore : RootStore;
const StoreContext = React.createContext(null);
const useStoreContext = () => React.useContext(StoreContext);
const useTaskStore = () => rootStore.taskStore;

const StoreProvider = ({
    children,
}: {
    children: React.ReactNode
}) => {
    rootStore = new RootStore();
    return (
        <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
    );
}

export {useStoreContext, StoreProvider, useTaskStore }