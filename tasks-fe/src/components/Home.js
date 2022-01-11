import React from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';

import List from './List'
import ShowTask from './ShowTask';
import MenuButton from "./MenuButton";
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore } from "../store/StoreContext";


const Home = observer(() => {
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();

    return ( 
        <div id="home-wrapper">
            <div id="new-wrapper"></div>
            <div id="show-wrapper">{ taskStore.focusedTask ? <ShowTask task={taskStore.focusedTask} /> : null }</div>
            <div id="left-menu" className="menu">
                <MenuButton src={add} alt="Plus icon for add new task" onClick={() => {alertStore.add("notice", "Sorry, we haven't implemented adding new tasks.")}}/>
                <MenuButton src={logout} alt="Power off icon for log out" onClick={() => {alertStore.add("notice", "Sorry, we haven't implemented users or logging out.")}}/>
            </div>
            <ul>
            </ul>
            <List store={taskStore} />
            <div id="slider"></div>
            <div id="calendar-wrapper">
            </div>
        </div>
    );
})

export {Home};
