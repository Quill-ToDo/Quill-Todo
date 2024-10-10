import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    forwardRef, 
    ForwardRefRenderFunction, 
    ReactNode,
 } from "react";
import "./draggable.css";
import { 
    DraggableDndKitImplementation, 
    DroppableDndKitImplementation, 
    WrapWithDndContext 
} from "@/external/DndKit";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export type DragDropData = {
    type: string,
    value: any,
} | null;
type DragDropEventData = {
    e: DragEndEvent | DragStartEvent, 
    drag: DragDropData, 
    drop: DragDropData
}

export type DraggableParams = {
    // These props must be spread out onto the draggable item
    renderDraggableItem: ForwardRefRenderFunction<
        HTMLElement,
        { className: string,
          id: string,
        }
        | ComponentPropsWithoutRef<any>>,
    actionTitle: string,
    useHandle?: boolean,
    onDragStart?: ({...props}: DragDropEventData) => void,
    onDragEnd?: ({...props}: DragDropEventData) => void,
    droppable?: boolean,
    itemType?: string,
    itemData?: {},
}

export type DroppableParams = {
    itemType: string,
    acceptedItemTypes: string[],
    renderDroppableItem: ForwardRefRenderFunction<
        HTMLElement, 
        { id: string,
        } | ComponentPropsWithoutRef<any>
    >,
    onDrop?: ({...props}: DragDropEventData) => void,
}

export const DRAGGABLE_HANDLE_CLASS = "draggable-handle";
export const DRAGGABLE_CLASS = "draggable";
/**
* Draggable helper to serve as an interface between Quill and any
* 3rd party libraries.
* 
* Droppable specifies whether the element should be free drag and remain 
* in it's last dropped position or return to its origin.
* @param id a unique ID for this draggable element
* @param droppable whether this should be droppable (return to last valid position) 
* or a freely draggable element (stays where you last drag it)
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

export const DragContextProvider = ({children}: {children: ReactNode}) => {
    return <WrapWithDndContext>
        { children }
    </WrapWithDndContext>;
};

/**
* Droppable helper to serve as an interface between Quill and any
* 3rd party libraries.
* 
*/
export const Droppable = forwardRef((props: DroppableParams, ref) => {
    return <DroppableDndKitImplementation 
        ref={ref}
        {...props}
    />
})

