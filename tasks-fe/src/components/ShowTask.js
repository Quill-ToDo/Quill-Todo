import React, {
    useEffect,
    useCallback,
    useRef
} from "react";
import Task from "./List/Task";
import '../static/css/show.css';
import { observer } from "mobx-react-lite";
import { addAlert, NOTICE_ALERT } from '../static/js/alertEvent';

function handleEdit () {
    addAlert(document.querySelector("#btn-edit"), NOTICE_ALERT, "Edit is not implemented")
}

const ShowTask = observer((props) => {
    const previouslyFocused = useRef(null);
    const filterEle = useRef(null);
    const taskStore = props.taskStore;
    const task = taskStore.taskBeingFocused;
    const closeFn = useCallback(
        () => {
            taskStore.removeFocus();
        },
        [taskStore],
    )
    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        filterEle.current = document.getElementsByClassName("filter")[0];
        document.getElementById("home-wrapper").tabIndex = -1;
        document.getElementById("show-checkbox-"+task.id).focus();
        window.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Escape":
                    closeFn();
                    break;
                case "Esc":
                    closeFn();
                    break;
                default:
                    return;
            }
        });

        return () => {
            previouslyFocused.current.focus();
        }
    }, [closeFn, task.id])

    const buttons = <div className="aligned-buttons">
                        <button id="btn-delete" className="btn" title="Delete task" onClick={() => {
                            task.delete();
                            closeFn();
                            }}>
                            {/* <img src={bin} alt="Trash icon for delete"></img> */}
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button id="btn-edit" className="btn" title="Edit task" onClick={()=>handleEdit()}>
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
                aria-describedby={"task-title-" + task.id}
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