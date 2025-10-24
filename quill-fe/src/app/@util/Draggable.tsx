import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef,
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
import { 
    DragTypesToDragDataTypes, 
    RequiredDragData, 
    RequiredDropData 
} from "./DraggableTypes";

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
export const Draggable: <DragData extends RequiredDragData,>(props: DraggableParams<DragData> & ComponentPropsWithoutRef<any>, ref: ForwardedRef<any>) => ReactNode
= observer(forwardRef<any, DraggableParams<any>>(({
    children,
    useHandle=false,
    mayBeDropped=false,
    actionTitle="Drag item",
    ...props
}, ref) => {
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
    itemData: DragData,
    actionTitle: string,
    children: ReactNode,
    mayBeDropped: boolean,
    draggedPresentation?: ReactNode,
    useHandle?: boolean,
    dragStart?: ({drag, e}: FormattedDragDropEventData<DragData, any>) => void,
    dragEnd?: ({drag, e}: FormattedDragDropEventData<DragData, any>) => void,
    positioningProps?: PropsWithoutRef<any>,
} & ComponentPropsWithoutRef<"div">

export type FormattedDragDropEventData<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
    e: GenericDragEvent,
    drag: DragData | null, 
    drop: DropData | null,
};

type GenericDragEvent = {
    isDragging: boolean,
}


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
export const Droppable: <DropData extends RequiredDropData,>(props: DroppableParams<DropData>, ref: ForwardedRef<any>) => ReactNode 
    = observer(forwardRef<any, DroppableParams<any>>((props, ref) => {
        return <DroppableDndKitImplementation
            ref={ref}
            {...props}
    />
}))

export type DragCallbacks<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
        setDataWhenDragOver?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        saveDataWhenDragEnds?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        resetDataWhenDragOff?:({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragEnd?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragOver?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragCancel?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragStart?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragMove?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
}

 type CallbackMap<DropData extends RequiredDropData> = {
    [key in keyof Partial<DragTypesToDragDataTypes>]: DragCallbacks<DragTypesToDragDataTypes[key], DropData>;
} & {
    [key: string]: DragCallbacks<any, DropData>;
}
// Params droppable items must supply
export type DroppableParams<DropData extends RequiredDropData> = {
    children: ReactNode,
    callbacksForAcceptedDragTypes: CallbackMap<DropData>,
    itemData: DropData,
    collisionPriority?: number,
} & ComponentPropsWithoutRef<"div">;
