import { DndContext, DragOverlay, useDndContext, useDraggable } from "@dnd-kit/core";
import { observer } from "mobx-react-lite";
import { Dispatch, ReactElement, SetStateAction, useId, useState } from "react";
import "./draggable.css";

export type DraggableParams = {
    renderDraggableContent: () => ReactElement<any>,
    handle?: boolean,
    droppable?: boolean,
    dropTargetTypes?: string[],
    isDragging?: [boolean, Dispatch<SetStateAction<boolean>>],
}

export const DRAGGABLE_HANDLE_CLASS = "draggable-handle";

export const Draggable = observer((
    {
        handle=false,
        droppable=false,
        ...props
    } : DraggableParams) => {


        return <DraggableDndKitImplementation 
            handle={handle}
            droppable={droppable}
            {...props}
        />
    })


const DraggableDndKitImplementation = ({ ...props } : DraggableParams) => {
    // TODO: Figure out how to handle rendering a handle. I have a feeling it might have to be done in a callback
    // passing listeners and attributes because you add those to the handle
    // const parentDndContext = useDndContext();
    const id = useId();
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: id,
    });

    const moveStyle = !props.droppable && transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      } : undefined;
    
      
    const [isDragging, setIsDragging] = useState(false);

    const draggableContent = <>
        <div
            // Make dragged content 
            ref={setNodeRef} 
            style={moveStyle}
            {...listeners} 
            {...attributes}
        >
            { props.renderDraggableContent() }
        </div>
        {/* This is the content rendered on the drag preview layer/overlay. Drag overlay should
        always be mounted */}
        { props.droppable ? <DragOverlay>
            {isDragging 
                ? props.renderDraggableContent()
                : null
            }
        </DragOverlay> 
        : undefined 
        }
    </>

// return parentDndContext.active ? draggableContent :
    return <DndContext 
            onDragStart={(event) => {
                setIsDragging(true);
                // callback ?
            }} 
            onDragEnd={(event) => {
                setIsDragging(false);
                // callback ?
        }}
        >
            { draggableContent }
        </DndContext>
}


