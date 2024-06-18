import React, {
    useEffect,
    useRef,
    MutableRefObject,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { ICONS } from "@/util/constants";
import {TaskModel} from "@/store/tasks/TaskModel";
import {Checkbox, ColorBubble, DateTimeWrapper, TaskTitle} from "@/widgets/TaskDetail/TaskComponents";

const WIDGET_NAME = "show-wrapper";

const TaskDetail = observer(({
        task, 
        close,
    }: {
        task: TaskModel,  
        close: () => void,
}) => {
    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const checkboxId = `${WIDGET_NAME}-checkbox-${task.id}`;

    useEffect(() => {
        // Keep track of the previously focused element and
        previouslyFocused.current = document.activeElement as HTMLElement;
        const taskCheckbox  : HTMLElement | null = document.getElementById(checkboxId);
        taskCheckbox && taskCheckbox.focus();
        // const popup = refs.floating.current
        // popup && makeDraggableUsingFloating({containerRef: popup});
        return () => {
            // return focus to previous point after the popup closes
            previouslyFocused && previouslyFocused.current ? previouslyFocused.current.focus():null;
        }
    }, [task.id])

    const buttons = <div className="aligned end">
                        <button 
                            id="btn-delete"
                            className="btn small square no-shadow"
                            title="Delete task" 
                            onClick={() => {
                                task.store.delete(task);
                                close();
                            }
                        }>
                            <i className="far fa-trash-alt fa-fw fa"></i>
                        </button>
                        <button 
                            className="btn small square btn-red"
                            title="Close"
                            onClick={() => {
                                console.log("triggied")
                                close();
                            }}>
                            { ICONS.X }
                        </button>
                    </div>;

    return (
        <section 
            className={`popup draggable ${WIDGET_NAME}`}
        > 
            <div>
                <div className={`task-wrapper header-container aligned draggable-handle ${task.complete && "complete"}`} data-testid={`taskwrapper-${task.title}`} >
                    <div className="checkbox-color">
                        <ColorBubble task={task} />
                        <Checkbox 
                            task={task}
                            type={"due"}
                            checkboxId={checkboxId}
                        />
                    </div>
                    <TaskTitle task={task} editAllowed={true} />   
                    {buttons}             
                </div>
                <section 
                    className="mid-section" 
                    role="dialog"
                    aria-labelledby="task-show-title"
                >
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
        </section>
)})

export default TaskDetail;