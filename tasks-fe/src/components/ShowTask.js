import React, {
    useEffect,
    useRef
} from "react";
import Task from "./Task";
import '../static/css/show.css';
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore} from "../store/StoreContext";

function handleEdit (alerts) {
    alerts.add("notice", "Edit is not implemented")
}

const ShowTask = observer((props) => {

    const previouslyFocused = useRef(null);
    const task = props.task;
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();

    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        document.getElementById("home-wrapper").tabIndex = -1;
        document.getElementById("checkbox-"+task.pk).focus();
        window.addEventListener("keydown", (e) => {
            if (e.defaultPrevented) {
                return;
            }
            switch (e.key) {
                case "Escape":
                    taskStore.removeFocus();
                    break;
                case "Esc":
                    taskStore.removeFocus();
                    break;
                default:
                    return;
            }
            e.preventDefault();
        })

        return () => {
            previouslyFocused.current.focus();
        }
    }, [])

    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" title="Delete task" onClick={() => {
                            task.delete();
                            taskStore.removeFocus();
                            }}>
                            {/* <img src={bin} alt="Trash icon for delete"></img> */}
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button id="btn-edit" className="btn" title="Edit task" onClick={()=>handleEdit(alertStore)}>
                            <i className="far fa-edit fa-fw fa"></i>
                        </button>
                        <button className="btn btn-red" title="Close" onClick={() => {taskStore.removeFocus()}}>
                            <i className="fas fa-times fa-fw fa-2x"></i>
                        </button>
                    </div>;

    return (
        <section id="show-wrapper" role="dialog" aria-labelledby="task-show-title" aria-describedby={"task-title-" + task.pk}>
            <h2 id="task-show-title">Task Details</h2>
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
        </section>
    );
})

export default ShowTask