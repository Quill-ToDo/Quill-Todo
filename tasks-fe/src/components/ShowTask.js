import React, { Fragment } from "react";
import bin from "../static/images/bin.png" 
import edit from "../static/images/editing.png"
import Task from "./Task";
import '../static/css/show.css';
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../store/StoreContext";

function handleEdit () {
    console.log("Edit!")
}

const ShowTask = observer((props) => {
    const task = props.task;
    const store = useTaskStore();


    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" onClick={() => {
                            task.delete();
                            store.removeFocus();
                            }}>
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
                    data={task} 
                    basicVersion={false} 
                    buttons={buttons}
                    type="due"
                />
            </section>
            <div className="filter" onClick={() => {store.removeFocus()}}>
            </div>
        </Fragment>
    );
})

export default ShowTask