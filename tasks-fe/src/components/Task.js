import React from "react";

class Task extends React.Component {
   constructor(props) {
        super(props);
        this.state = {
            title: props.data.title,
            complete: props.data.complete,
            description: props.data.description,
            due: props.data.due,
            start: props.data.start,
            type: "due"
        };  
    }



    render () {
        var under_box;
        if (this.state.complete) {
            under_box = <input type="checkbox" aria-labelledby="{this.state.title}" checked></input>;
        }
        else {
            under_box = <input type="checkbox" aria-labelledby="{this.state.title}"></input>;
        }

        var check_mark;
        if (this.state.type === "due") {
            check_mark = <span className="checkmark"></span>;
        }
        else {
            check_mark = <span className="checkmark round"></span>;
        }


        return (
            <div className="task-wrapper">
                <div className="check-box-wrapper"> 
                    {under_box}
                    {check_mark}
                </div>
                <div className="title-date-wrapper">
                    <button><p className="title">{this.state.title}</p></button>
                    <div class="date-time-wrapper"> 
                        <p className="date">{new Date(this.state.due).format('mm/dd/yy')}</p>
                        <p className="time">{new Date(this.state.due).format('h:MM A')}</p>
                    </div>
                </div>
            </div>
        )
    } 

}

export default Task