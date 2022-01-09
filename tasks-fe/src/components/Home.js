import React from "react";

import List from './List'
import ShowTask from './ShowTask';
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore } from "../store/StoreContext";


const Home = observer(() => {
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();
    const showNewPopUp = false;
    var sliderPos = 30;

    return ( 
        <div id="home-wrapper">
            { showNewPopUp ? < div id="new-wrapper"></div> : null }
            { taskStore.focusedTask ? <ShowTask task={taskStore.focusedTask} /> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="menu">
                <button role="menuitem" className="btn" title="Add task" onClick={() => alertStore.add("notice", "We haven't implemented adding new tasks.")}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button role="menuitem" className="btn" title="Log out" onClick={() => alertStore.add("notice", "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            <List store={taskStore} />
            <div>
                <hr tabIndex={0} id="slider" aria-orientation="vertical" aria-valuenow={sliderPos}/>
            </div>
            <section id="calendar-wrapper"></section>
        </div>
    );
})

export default Home;
