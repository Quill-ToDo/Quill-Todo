import React, { useState } from "react";

import List from './List'
import ShowTask from './ShowTask';
import TaskCreatePopup from "./TaskCreatePopup";
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore } from "../store/StoreContext";


const Home = observer(() => {
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();
    const [showNewTaskPopup, setShowNewTaskPopup] = useState(false);

    return ( 
        <div id="home-wrapper">
            { showNewTaskPopup && !taskStore.focusedTask ? <TaskCreatePopup closeFn={() => setShowNewTaskPopup(!showNewTaskPopup)}/> : null }
            { taskStore.focusedTask ? <ShowTask task={taskStore.focusedTask} /> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="menu">
                <button role="menuitem" className="btn" title="Add task" type="button" onClick={() => setShowNewTaskPopup(!showNewTaskPopup)}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button role="menuitem" className="btn" title="Log out" type="button" onClick={() => alertStore.add("notice", "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            <List store={taskStore} />
            <div>
                <hr tabIndex={0} id="slider" aria-orientation="vertical"/>
            </div>
            <section id="calendar-wrapper"></section>
        </div>
    );
})

export default Home;
