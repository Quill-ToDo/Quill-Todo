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
    const filterEle = useRef(null);
    const task = props.task;
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();
    const closeFn = () => {taskStore.removeFocus()};

    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        filterEle.current = document.getElementsByClassName("filter")[0];
        document.getElementById("home-wrapper").tabIndex = -1;
        document.getElementById("show-checkbox-"+task.pk).focus();
        window.addEventListener("keydown", (e) => {
            if (e.defaultPrevented) {
                return;
            }
            switch (e.key) {
                case "Escape":
                    console.log("ESCAPE LOGGED")
                    closeFn();
                    break;
                case "Esc":
                    closeFn();
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
                            closeFn();
                            }}>
                            {/* <img src={bin} alt="Trash icon for delete"></img> */}
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button id="btn-edit" className="btn" title="Edit task" onClick={()=>handleEdit(alertStore)}>
                            <i className="far fa-edit fa-fw fa"></i>
                        </button>
                        <button className="btn btn-red" title="Close" onClick={closeFn}>
                            <i className="fas fa-times fa-fw fa-2x"></i>
                        </button>
                    </div>;

    return (
        <section id="show-wrapper" >
            <h2 id="task-show-title">Task Details</h2>
            <section 
                className="mid-section" 
                role="dialog"
                aria-labelledby="task-show-title"
                aria-describedby={"task-title-" + task.pk}
            >
                <Task 
                    data={task} 
                    basicVersion={false} 
                    buttons={buttons}
                    type="due"
                />
            </section>
            <div 
                className="filter" 
                data-testid="show-filter"
                onClick={closeFn}
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === " " || e.key === "Enter") && e.target === filterEle.current) {
                        closeFn();
                    }
                }}
            >
            </div>
        </section>
    );
})

export default ShowTask