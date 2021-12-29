import React, { Fragment } from "react";
import CheckBox from "./CheckBox";
import bin from "../static/images/bin.png" 
import edit from "../static/images/editing.png"
import Task from "./Task";
import '../static/css/show.css'

class ShowTask extends React.Component {
    // Figure out how to update this in the list and calendar on update. 
    // Re render those sections 

    constructor (props) {
        super(props);
        console.log("render")

        this.handleClickOff = this.handleClickOff.bind(this);
    }

    handleClickOff () {
        this.props.clickOffHandler();
    }

    handleDelete () {
        console.log("Delete!!")
    }

    handleEdit () {
        console.log("Edit!")
    }

    render () {
        const buttons = <div className="aligned-buttons">
                            <button id="btn-delete" className="btn" onClick={this.handleDelete}>
                                <img src={bin} alt="Trash icon for delete"></img>
                            </button>
                            <button id="btn-edit" className="btn" onClick={this.handleEdit}>
                                <img src={edit} alt="Pencil and paper icon for edit"></img>
                            </button>
                        </div>;

        return (
            <Fragment>
                <section className="mid-section">
                    <Task 
                        data={this.props.task} 
                        basicVersion={false} 
                        buttons={buttons}
                        type="due"
                    />
                </section>
                <div className="filter" onClick={this.handleClickOff}>
                </div>
            </Fragment>
        );
    }
}


export default ShowTask