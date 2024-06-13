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

const TaskDetail = observer((
    {
        task, 
        floatHelperRefs, 
        floatHelperRefStyle,
        // getFloatingProps,
        // setShowState,
        close,
    }: 
    {
        task: TaskModel,  
        floatHelperRefs: any, 
        floatHelperRefStyle: {},
        // getFloatingProps: () => {},
        // setShowState: (arg0: boolean) => void,
        close: () => void,
    }
    ) => {

    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const checkboxId = `${WIDGET_ID}-checkbox-${task.id}`;

    useEffect(() => {
        // Keep track of the previously focused element and
        previouslyFocused.current = document.activeElement as HTMLElement;
        const taskCheckbox  : HTMLElement | null = document.getElementById(checkboxId);
        taskCheckbox && taskCheckbox.focus();
        // const popup = document.querySelector(WIDGET_ID) as HTMLElement;
        // popup && makeDraggable(popup);
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
            id={WIDGET_NAME} 
            className="popup" 
            ref={floatHelperRefs.setFloating} 
            style={floatHelperRefStyle} 
        > 
            {/* // style={floatHelperRefStyle} >  */}
            <div>
                <div className={`task-wrapper header-container aligned draggable-handle ${task.complete && "complete"}`} data-testid={`taskwrapper-${task.title}`} >
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