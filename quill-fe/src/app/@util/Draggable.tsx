import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    forwardRef, 
    ForwardRefRenderFunction, 
    PropsWithoutRef, 
    ReactNode,
 } from "react";
import "./draggable.css";
import { 
    DraggableDndKitImplementation, 
    DroppableDndKitImplementation, 
    WrapWithDndContext 
} from "@/external/DndKit";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export const INTERACTABLE_ELEMENT_CLASS = "interactable";

export type DragDropData = {
    type: string,
    value: DraggableParams["itemData"],
} | null;
export type DragDropEventData = {
    drag: DragDropData, 
    drop: DragDropData
}

export type DraggableParams = {
    // These props must be spread out onto the draggable item
    children: ReactNode,
    useHandle?: boolean,
    draggedPresentation?: ReactNode,
    droppable?: boolean,
    dragStart?: (e: DragStartEvent, callback?: (dragStartPosition: {x: number, y: number}) => void) => void,
    dragEnd?: (e: DragEndEvent, callback?: (dragEndPosition: {x: number, y: number}) => void) => void,
    actionTitle: string,
    positioningProps?: PropsWithoutRef<any>,
    itemType?: string,
    itemData?: any,
}

export type DroppableParams = {
    itemType?: DraggableParams["itemType"],
    itemData?: DraggableParams["itemData"],
    acceptedItemTypes: string[],
    renderDroppableItem: ForwardRefRenderFunction<
        HTMLElement, 
        { id: string,
        } & ComponentPropsWithoutRef<any>
    >,
    onDrop?: ({...props}: DragDropEventData) => void,
}
/**
* Draggable helper to serve as an interface between Quill and any
* 3rd party libraries.
* ## To mark an element potentially within the drag handle as 
* NOT being part of the handle, give it the class INTERACTABLE_ELEMENT_CLASS
* 
* @param id a unique ID for this draggable element
* @param droppable whether the element should be free drag and remain 
* in its last dropped position or return to its origin position when the user releases their cursor
* @param useHandle Whether to use a specific element within the droppable content as a drag handle or use any point
* as a drag handle. **If true, one element within the draggable content that will serve as a drag handle 
* should have the class DRAGGABLE_HANDLE_CLASS.**
*/
export const Draggable = observer(forwardRef(({
    children,
    useHandle=false,
    droppable=false,
    actionTitle="Drag item",
    ...props
} : DraggableParams, ref) => {
    return <DraggableDndKitImplementation 
        ref={ref}
        actionTitle={actionTitle}    
        useHandle={useHandle}
        droppable={droppable}
        {...props}
    >
        {children}
    </DraggableDndKitImplementation>
}));

export const DragContextProvider = observer(({children}: {children: ReactNode}) => {
    return <WrapWithDndContext>
        { children }
    </WrapWithDndContext>;
});

/**
* Droppable helper to serve as an interface between Quill and any
* 3rd party libraries.
* 
*/
export const Droppable = observer(forwardRef((props: DroppableParams, ref) => {
    return <DroppableDndKitImplementation 
        ref={ref}
        {...props}
    />
}))
