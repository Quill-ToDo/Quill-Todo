import React from "react";

import List from './List/List'
import ShowTask from './ShowTask';
import TaskCreatePopup from "./TaskCreatePopup";
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore } from "../store/StoreContext";


const Home = observer(() => {
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();

    return ( 
        <div id="home-wrapper" data-testid="home">
            { taskStore.taskBeingEdited && !taskStore.taskBeingFocused ? <TaskCreatePopup taskStore={taskStore}/> : null }
            { taskStore.taskBeingFocused ? <ShowTask taskStore={taskStore}/> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="menu">
                <button role="menuitem" className="btn no-shadow" title="Add task" type="button" onClick={() => {
                    taskStore.createInProgressTask();
                    }}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button role="menuitem" className="btn btn no-shadow" title="Log out" type="button" onClick={() => alertStore.add("notice", "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            <List store={taskStore} />
            <div>
                <hr tabIndex={0} id="slider" aria-orientation="vertical"/>
            </div>
        </div>
    );
})

export default Home;
