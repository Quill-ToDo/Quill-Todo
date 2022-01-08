import React, {
    useEffect
} from "react";
import Task from "./Task";
import '../static/css/show.css';
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore} from "../store/StoreContext";

function handleEdit (alerts) {
    alerts.add("notice", "Edit is not implemented")
}

const ShowTask = observer((props) => {

    // const previously = useRef(initialValue)
    const task = props.task;
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();

    useEffect(() => {
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
            // 
        }
    }, [])

    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" onClick={() => {
                            task.delete();
                            taskStore.removeFocus();
                            }}>
                            {/* <img src={bin} alt="Trash icon for delete"></img> */}
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button id="btn-edit" className="btn" onClick={()=>handleEdit(alertStore)}>
                            <i className="far fa-edit fa-fw fa"></i>
                        </button>
                    </div>;

    return (
        <section id="show-wrapper">
            <h2>Task Details</h2>
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