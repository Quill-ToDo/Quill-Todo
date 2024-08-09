import { DndContext, DragOverlay, useDndContext, useDraggable } from "@dnd-kit/core";
import { observer } from "mobx-react-lite";
import { Dispatch, ReactElement, SetStateAction, useId, useState } from "react";

export type DraggableParams = {
    renderDraggableContent: (beingDragged: boolean) => ReactElement<any>,
    handle?: boolean,
    dropTargetTypes?: string[],
    isDragging?: [boolean, Dispatch<SetStateAction<boolean>>],
}

export const Draggable = observer((
    {
        handle=false,
        ...props
    } : DraggableParams) => {
        
        // This could be moved outside or be here
        const [isDragging, setIsDragging] =  props.isDragging ? props.isDragging : useState(false);

        return <DraggableDndKitImplementation 
            handle={handle}
            isDragging={[isDragging, setIsDragging]}
            {...props}
        />
    })


const DraggableDndKitImplementation = ({ ...props } : DraggableParams) => {
    const parentDndContext = useDndContext();
    const id = useId();
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
    });
    
    const [isDragging, setIsDragging] =  props.isDragging 
            ? [props.isDragging[0], props.isDragging[1]] 
            : useState(false);
    // TODO: Figure out how to handle rendering a handle. I have a feeling it might have to be done in a callback
    // passing listeners and attributes because you add those to the handle
    // TODO: Figure out what to pass back in the renderDraggableContent method. probably things like
    // "overValidDropTarget" ...? On drop? Or maybe droppable handles that.
    const draggableContent = <>
        <div
            // Make dragged content 
            ref={setNodeRef} 
            {...listeners} 
            {...attributes}
        >
            { props.renderDraggableContent(isDragging) }
        </div>
        {/* This is the content rendered on the drag preview layer/overlay */}
        <DragOverlay>
            {isDragging 
                ? props.renderDraggableContent(true)
                : null
            }
        </DragOverlay>
    </>

    return parentDndContext ? draggableContent :
        <DndContext 
            onDragStart={() => {
                setIsDragging(true);
                // callback
            }} 
            onDragEnd={() => {
                setIsDragging(false);
                // callback
        }}>
            { draggableContent }
        </DndContext>
}


