import React from "react";

import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'
import MenuButton from "./MenuButton";
import ShowTask from './ShowTask';


class Index extends React.Component {
    constructor (props) {
        super(props);
        this.toggleShow = this.toggleShow.bind(this);
        this.handleTaskChange = this.handleTaskChange.bind(this);
        
        this.state = {
            show: null,
        }
    }
    
    toggleShow (task, delHandler, completeHandlder) {
        console.log(task)
        if (this.state.show === null) {
            this.setState({show: <ShowTask 
                task={task} 
                clickOffHandler={this.toggleShow} 
                delHandler={delHandler}
                completeHandlder={completeHandlder}
            />}); 
            document.getElementById("show-wrapper").style.display="flex";
        }
        else {
            this.setState({show: null});
            document.getElementById("show-wrapper").style.display="none";
        }
    }

    handleTaskChange (e) {
        // if (document.getElementById("show-wrapper").contains(e.srcElement)) {
        //     // Task was changed from show wrapper, update list component
        //     console.log("Gotta refresh list!");
        // }
        // TODO: Update calendar component
    } 

    componentDidMount () {
        document.getElementById("index-wrapper").addEventListener("taskStateChange", this.handleTaskChange);
    }

    componentWillUnmount () {
        document.getElementById("index-wrapper").removeEventListener("taskStateChange", this.handleTaskChange);
    }

    render () {
        return ( 
            <div id="index-wrapper">
                <div id="new-wrapper"></div>
                <div id="show-wrapper">{this.state.show}</div>
                <div id="left-menu" className="menu">
                    <MenuButton src={add} alt="Plus icon for add new task" link=""/>
                    <MenuButton src={logout} alt="Power off icon for log out" link=""/>
                </div>
                <List TaskClickCallback={this.toggleShow} />
                <div id="slider"></div>
                <div id="calendar-wrapper">
                </div>
            </div>
        );
    }
}

export default Index;