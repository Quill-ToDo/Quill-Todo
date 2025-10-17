import { observer } from "mobx-react-lite";
import { 
    ForwardedRef,
    forwardRef, 
    PropsWithoutRef, 
    ReactNode,
 } from "react";
import "./draggable.css";
import { 
    DraggableDndKitImplementation, 
    DroppableDndKitImplementation, 
    WrapWithDndContext 
} from "@/external/DndKit";
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { RequiredDragData, RequiredDropData } from "./DraggableTypes";

export const INTERACTABLE_ELEMENT_CLASS = "interactable";

/**
* Draggable helper to serve as an interface between Quill and any
* 3rd party libraries.
* ## To mark an element potentially within the drag handle as 
* NOT being part of the handle, give it the class INTERACTABLE_ELEMENT_CLASS
* 
* @param id a unique ID for this draggable element
* @param droppable whether the element should be able to be dropped into Droppable containers and
*  return to its origin position when the user releases their cursor 
*  or be free drag and remain in its last dropped position
* @param useHandle Whether to use a specific element within the droppable content as a drag handle or use any point
* as a drag handle. **If true, one element within the draggable content that will serve as a drag handle 
* should have the class DRAGGABLE_HANDLE_CLASS.**
*/
export const Draggable: <DragData extends RequiredDragData,>(props: DraggableParams<DragData>, ref: any) => ReactNode 
= observer(forwardRef(({
    children,
    useHandle=false,
    mayBeDropped=false,
    actionTitle="Drag item",
    ...props
} : DraggableParams<any>, ref: ForwardedRef<any>) => {
    return <DraggableDndKitImplementation
        ref={ref}
        actionTitle={actionTitle}    
        useHandle={useHandle}
        mayBeDropped={mayBeDropped}
        {...props}
    >
        {children}
    </DraggableDndKitImplementation>
}));

// Params draggable items must supply
export type DraggableParams<DragData extends RequiredDragData> = {
    children: ReactNode,
    useHandle?: boolean,
    draggedPresentation?: ReactNode,
    mayBeDropped: boolean,
    dragStart?: ({drag, e}: DragEventData<DragData>) => void,
    dragEnd?: ({drag, e}: DragEventData<DragData>) => void,
    actionTitle: string,
    positioningProps?: PropsWithoutRef<any>,
    itemData: DragData,
}
export type DragEventData<DragData extends RequiredDragData> = {
    e: DragStartEvent | DragEndEvent,
    drag: DragData, 
};

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
export const Droppable: <DropData extends RequiredDropData,>({...props}: DroppableParams<DropData>, ref: any) => ReactNode 
    = observer(forwardRef<any, DroppableParams<any>>((props, ref) => {
        return <DroppableDndKitImplementation
            ref={ref}
            {...props}
    />
}))

// Params droppable items must supply
export type DroppableParams<DropData extends RequiredDropData> = {
    children: ReactNode,
    callbacksForAcceptedDragTypes: {
        type: string,
        dragEnd?: ({drag, drop, e}: DropEventData<any, DropData>) => void,
        dragOver?: ({drag, drop, e}: DropEventData<any, DropData>) => void,
    }[],
    itemData: DropData,
}
export type DropEventData<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
    e: DragEndEvent | DragOverEvent,
    drag: DragData, 
    drop: DropData,
};
