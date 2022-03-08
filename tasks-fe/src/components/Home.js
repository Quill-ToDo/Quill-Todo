import React from "react";

import List from './List/List'
import ShowTask from './ShowTask';
import TaskCreatePopup from "./TaskCreatePopup";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../store/StoreContext";
import { addAlert, NOTICE_ALERT } from '../static/js/alertEvent';


const Home = observer(() => {
    const taskStore = useTaskStore();

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
                <button role="menuitem" className="btn btn no-shadow" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), NOTICE_ALERT, "We haven't implemented users or logging out.")}>
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
