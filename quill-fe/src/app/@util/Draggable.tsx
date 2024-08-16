import { observer } from "mobx-react-lite";
import { ReactElement, } from "react";
import "./draggable.css";
import { DraggableDndKitImplementation } from "@/external/DndKit";


export type RenderDraggableContent = (handleProps?: any) => ReactElement<any>;
export type DraggableParams = {
    renderDraggableContent: RenderDraggableContent,
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
* in it's last dropped position or return to its origin
*/
export const Draggable = observer((
    {
        useHandle=false,
        droppable=false,
        ...props
    } : DraggableParams) => {
        return <DraggableDndKitImplementation 
            useHandle={useHandle}
            droppable={droppable}
            {...props}
        />
    })

