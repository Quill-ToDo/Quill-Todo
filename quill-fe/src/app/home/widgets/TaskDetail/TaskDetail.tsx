import React, {
    useEffect,
    useCallback,
    useRef,
    MutableRefObject,
    Fragment,
    ReactNode
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { ICONS } from "@/util/constants";
import {TaskModel} from "@/store/tasks/TaskModel";
import {Checkbox, DateTimeWrapper} from "@/store/tasks/TaskComponents";
import TaskStore from "@/store/tasks/TaskStore";
import { DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";

const TaskPortion = observer(({task, actionButtons}: {task: TaskModel, actionButtons: ReactNode}) => {
    const checkboxId = `show-checkbox-${task.id}`;
    const classAddition = task.complete ? "complete" : "";
    const title = (
            <label htmlFor={checkboxId} onClick={(e) => {e.preventDefault()}}>
                {task.complete ? <p id={"task-title-" + task.id} className={"title " + classAddition}><s>{task.title}</s></p>
                : <p id={"task-title-" + task.id} className={"title " + classAddition}>{task.title}</p>}    
            </label>
    );
    const dateForm = DATETIME_FORMATS.D_t;
    
    return (
        <Fragment>
            <div className="header-container">
                <div className="task-wrapper" data-testid={"taskwrapper-"+task.title} >
                    <div className="title-wrapper">
                        <Checkbox 
                            task={task}
                            type={"due"}
                            checkboxId={checkboxId}
                        />
                        {title}
                    </div>
                </div>
                {actionButtons}
            </div>
            <div className="dark-section">
                <div className="date-wrapper">
                    <div>
                        <h3>Start</h3>
                        {task.start ? 
                            <DateTimeWrapper 
                                task={task} 
                                type="start" 
                                dateFormat={dateForm} 
                            />
                            :
                            <p className="subtle"> Not set </p>
                        }
                    </div>
                    <div> 
                        <h3>Due</h3>
                        {task.due ? 
                           <DateTimeWrapper 
                                task={task} 
                                type="due" 
                                dateFormat={dateForm} 
                            />
                            :
                            <p className="subtle"> Not set </p>
                        }
                    </div>
                </div>
                {task.description &&
                    <Fragment>
                        <hr />
                        <p className="centered">{task.description}</p>    
                    </Fragment>
                }
            </div>
        </Fragment>
    );
});

const TaskDetail = observer(({task}: {task: TaskModel}) => {
    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const filterEle: MutableRefObject<null | Element> = useRef(null);
    const taskStore: TaskStore = task.store;
    const closeFn = useCallback(
        () => {
            taskStore.removeFocus();
        },
        [taskStore],
    )
    useEffect(() => {
        // Keep track of the previously focused element and the new filter behind popup
        previouslyFocused.current = document.activeElement as HTMLElement;
        filterEle.current = document.getElementsByClassName("filter")[0];
        // Make items behind pop-up unfocusable and focus on focused tasks checkbox
        const home : HTMLElement | null = document.getElementById("home-wrapper");
        const taskCheckbox  : HTMLElement | null= document.getElementById("show-checkbox-"+task.id);
        home ? home.tabIndex = -1:null;
        taskCheckbox ? taskCheckbox.focus():null;
        // Add ESC keybindings
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
            previouslyFocused && previouslyFocused.current ? previouslyFocused.current.focus():null;
        }
    }, [closeFn, task.id])

    const buttons = <div className="aligned end">
                        <button id="btn-delete" className="btn small square no-shadow" title="Delete task" onClick={() => {
                            task.store.delete(task);
                            closeFn();
                            }}>
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button className="btn small square btn-red" title="Close" onClick={closeFn}>
                            { ICONS.X }
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
                <TaskPortion
                    task={task}
                    actionButtons={buttons}
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

export default TaskDetail;