import { observer } from "mobx-react-lite";
import { ComponentPropsWithRef, ReactNode, } from "react";
import "./draggable.css";
import { DraggableDndKitImplementation } from "@/external/DndKit";

export type DraggableParams = {
    // These props must be spread out onto the draggable item
    renderDraggableItem: (props?: ComponentPropsWithRef<any>) => ReactNode,
    actionTitle: string,
    useHandle?: boolean,
    droppable?: boolean,
    dropTargetTypes?: string[],
}

export const DRAGGABLE_HANDLE_CLASS = "draggable-handle";
/**
* Draggable helper to serve as an interface between Quill and any
* 3rd party libraries.
* 
* Droppable specifies whether the element should be free drag and remain 
* in it's last dropped position or return to its origin.
* @param useHandle Whether to use a specific element within the droppable content as a drag handle or use any point
* as a drag handle. If true, one element within the draggable content should have the class DRAGGABLE_HANDLE_CLASS
*/
export const Draggable = observer((
    {
        useHandle=false,
        droppable=false,
        actionTitle="Drag item",
        ...props
    } : DraggableParams) => {
        return <DraggableDndKitImplementation 
            actionTitle={actionTitle}    
            useHandle={useHandle}
            droppable={droppable}
            {...props}
        />
    })

