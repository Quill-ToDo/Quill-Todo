import React from "react";

class ShowTask extends React.Component {
    constructor (props) {
        super(props);
        console.log(props.task)
        this.state = {
            task: props.task,
            active: false,
        }
    }

    render () {
        if (this.state.task) {
            return (
                <p> beep </p> 
            )
        }
        return (
            null
        )

    }
}


export default ShowTask