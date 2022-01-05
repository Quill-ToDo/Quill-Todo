import React, { Fragment } from "react";
import bin from "../static/images/bin.png" 
import edit from "../static/images/editing.png"
import Task from "./Task";
import '../static/css/show.css';
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore} from "../store/StoreContext";

function handleEdit (alerts) {
    alerts.add("notice", "Edit is not implemented")
}

const ShowTask = observer((props) => {
    const task = props.task;
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();


    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" onClick={() => {
                            task.delete();
                            taskStore.removeFocus();
                            }}>
                            <img src={bin} alt="Trash icon for delete"></img>
                        </button>
                        <button id="btn-edit" className="btn" onClick={()=>handleEdit(alertStore)}>
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
            <div className="filter" onClick={() => {taskStore.removeFocus()}}>
            </div>
        </Fragment>
    );
})

export default ShowTask