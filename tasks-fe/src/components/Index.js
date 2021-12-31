import React from "react";

import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'
import MenuButton from "./MenuButton";
import ShowTask from './ShowTask';
import {
    API_URL
} from "../static/js/modules/TaskApi";
import axios from "axios";

class Index extends React.Component {
    constructor (props) {
        super(props);
        this.toggleShow = this.toggleShow.bind(this);
        this.refreshShow = this.refreshShow.bind(this);
        this.handleTaskChange = this.handleTaskChange.bind(this);
        
        this.state = {
            show: null,
            refreshList: false
        }
    }

    async refreshShow (pk) {
        return axios.get(API_URL + pk)
        .then(res => {
            this.setState({show: <ShowTask 
                task={res.data} 
                clickOffHandler={this.toggleShow} 
            />}); 
                document.getElementById("show-wrapper").style.display="flex";
        }).catch(e => {
            // TODO: Add to alert
            console.log("Couldn't render task details")
            console.log(e)
        })
    }
    
    toggleShow (pk) {
        if (this.state.show === null) {
            this.refreshShow(pk);
        }
        else {
            this.setState({show: null});
            document.getElementById("show-wrapper").style.display="none";
        }
    }

    handleTaskChange (e) {
        e.stopPropagation();
        if (document.getElementById("show-wrapper").contains(e.srcElement)) {
            // Refresh show if present
            this.refreshShow(e.detail.pk);
        }
        // Refresh list
        this.setState(prev => ({refreshListData: !prev.refreshListData}));
        // Refresh calendar
        console.log("Refresh calendar!")
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
                <List TaskClickCallback={this.toggleShow} needsRefresh={this.state.refreshListData}/>
                <div id="slider"></div>
                <div id="calendar-wrapper">
                </div>
            </div>
        );
    }
}

export default Index;