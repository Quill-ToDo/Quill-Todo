import React from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'
import ShowTask from './ShowTask';
import MenuButton from "./MenuButton";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../store/StoreContext";
import { isObservable, isObservableProp } from "mobx";
    

const Index = observer((props) => {
    const context = useTaskStore();
    // useState

    
    // console.log(isObservableProp(context, "focusedTask"))
    return ( 
        <div id="index-wrapper">
            <div id="new-wrapper"></div>
            <div id="show-wrapper">{ context.focusedTask ? <ShowTask task={context.focusedTask} /> : null }</div>
            <div id="left-menu" className="menu">
                <MenuButton src={add} alt="Plus icon for add new task" link=""/>
                <MenuButton src={logout} alt="Power off icon for log out" link=""/>
            </div>
            <ul>
            </ul>
            <List store={context} />
            <div id="slider"></div>
            <div id="calendar-wrapper">
            </div>
        </div>
    );
})

export {Index};
