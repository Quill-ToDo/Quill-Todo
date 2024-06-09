import React, {
    useEffect,
    useCallback,
    useRef,
    MutableRefObject,
    Fragment,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { ICONS } from "@/util/constants";
import {TaskModel} from "@/store/tasks/TaskModel";
import {Checkbox, ColorBubble, DateTimeWrapper, TaskTitle} from "@/widgets/TaskDetail/TaskComponents";
import TaskStore from "@/store/tasks/TaskStore";
import { makeDraggable } from "@/app/@util/Draggable";
import { FormField } from "@/app/@util/FormComponents";

const WIDGET_NAME = "show-wrapper";
const WIDGET_ID = `#${WIDGET_NAME}`;

const TaskDetail = observer(({task}: {task: TaskModel}) => {
    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const taskStore: TaskStore = task.store;
    const checkboxId = `${WIDGET_ID}-checkbox-${task.id}`;
    
    const closeFn = useCallback(
        () => {
            taskStore.removeFocus();
        },
        [taskStore],
    )

    useEffect(() => {
        // Keep track of the previously focused element and the new filter behind popup
        previouslyFocused.current = document.activeElement as HTMLElement;
        // Make items behind pop-up unfocusable and focus on focused tasks checkbox
        const home : HTMLElement | null = document.getElementById("home-wrapper");
        const taskCheckbox  : HTMLElement | null = document.getElementById(checkboxId);
        home && (home.tabIndex = -1);
        taskCheckbox && taskCheckbox.focus();
        const popup = document.querySelector(WIDGET_ID) as HTMLElement;
        popup && makeDraggable(popup);

        
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
        <section id={WIDGET_NAME} className="popup">
            <div>
                <div className="task-wrapper header-container aligned draggable-handle" data-testid={`taskwrapper-${task.title}`} >
                    <Checkbox 
                        task={task}
                        type={"due"}
                        checkboxId={checkboxId}
                    />
                    <TaskTitle task={task} />   
                    {buttons}             
                </div>
                <section 
                    className="mid-section" 
                    role="dialog"
                    aria-labelledby="task-show-title"
                >
                    <div className="dark-section">
                        <FormField 
                            name="Color"
                            value={task.color}
                            contentBeforeInput={<ColorBubble task={task} />}
                            onChange={()=>{}}
                            outerWidgetId={WIDGET_NAME}
                        />
                    </div>
                    <div className="dark-section">
                        <div className="date-wrapper aligned even">
                            <div>
                                <h3>Start</h3>
                                {task.start ? 
                                    <DateTimeWrapper 
                                        task={task} 
                                        type="start" 
                                    /> : 
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                            <div> 
                                <h3>Due</h3>
                                {task.due ? 
                                <DateTimeWrapper 
                                        task={task} 
                                        type="due" 
                                    /> :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                        </div>
                    </div>
                    {task.description &&
                        <div className="dark-section"> 
                            <p className="centered">{task.description}</p>            
                        </div>
                    }
                </section>
            </div>
        </section>);
})

export default TaskDetail;