import React, { Fragment } from "react";
import bin from "../static/images/bin.png" 
import edit from "../static/images/editing.png"
import Task from "./Task";
import '../static/css/show.css';
import { del } from "../static/js/modules/TaskApi.mjs";

async function handleDelete (props) {
    del(props.task.pk, document.getElementById("show-wrapper").getElementsByClassName("task-wrapper")[0])
    .then(() => {props.clickOffHandler();});
}

function handleEdit () {
    console.log("Edit!")
}

function ShowTask (props) {
    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" onClick={() => {
                            handleDelete(props)}}>
                            <img src={bin} alt="Trash icon for delete"></img>
                        </button>
                        <button id="btn-edit" className="btn" onClick={handleEdit}>
                            <img src={edit} alt="Pencil and paper icon for edit"></img>
                        </button>
                    </div>;

    return (
        <Fragment>
            <section className="mid-section">
                <Task 
                    data={props.task} 
                    basicVersion={false} 
                    buttons={buttons}
                    type="due"
                />
            </section>
            <div className="filter" onClick={props.clickOffHandler}>
            </div>
        </Fragment>
    );
}


export default ShowTask