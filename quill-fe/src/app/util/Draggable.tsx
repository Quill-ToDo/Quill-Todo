import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef,
    ForwardedRef,
    forwardRef, 
    ForwardRefRenderFunction, 
    ReactNode,
 } from "react";
import "./draggable.css";
import { 
    DraggableDndKitImplementation, 
    DraggableDndKitRenderMethodImplementation, 
    DroppableDndKitImplementation, 
    DroppableDndKitRenderMethodImplementation, 
    WrapWithDndContext 
} from "@/external/DndKit";
import { 
    DragStringTypesToDragDataType, 
    RequiredDragData, 
    RequiredDropData 
} from "./DraggableTypes";
import { DragMoveEvent } from "@dnd-kit/core";

export const INTERACTABLE_ELEMENT_CLASS = "interactable";

// Params draggable items must supply
export type DraggableParams<DragData extends RequiredDragData> = {
    itemData: DragData,
    actionTitle: string,
    droppable: boolean,
    draggedPresentation?: ReactNode,
    useHandle?: boolean,
    dragStart?: ({drag, e}: FormattedDragDropEventData<DragData, any>) => void,
    dragEnd?: ({drag, e}: FormattedDragDropEventData<DragData, any>) => void,
} & ComponentPropsWithoutRef<any>;

export type DraggableRenderMethodParams<DragData extends RequiredDragData> = DraggableParams<DragData> & {
    render: ForwardRefRenderFunction<any, any>
}

export type FormattedDragDropEventData<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
    e: GenericDragEvent,
    drag: DragData, 
    drop: DropData,
};

type GenericDragEvent = {
    isDragging: boolean,
}

export type DndKitDraggableData<DragData extends RequiredDragData> = {
    id: any,
    element: Element | undefined, 
    type: any, 
    isDragging: boolean, 
    isDropping: boolean, 
    alignment: any, 
    isDragSource: boolean, 
    status: any,
    data: DragData, 
} | null;

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
export const Draggable: <DragData extends RequiredDragData,>(props: DraggableParams<DragData> & {children: any}, ref: ForwardedRef<any>) => ReactNode
= observer(forwardRef<any, DraggableParams<any>>(({
    children,
    draggedPresentation,
    itemData,
    dragStart,
    dragEnd,
    useHandle=false,
    droppable=false,
    actionTitle="Drag item",
    ...props
}, ref) => {
    return <DraggableDndKitImplementation
            ref={ref}
            actionTitle={actionTitle}    
            useHandle={useHandle}
            droppable={droppable}
            draggedPresentation={draggedPresentation}
            itemData={itemData}
            dragStart={dragStart}
            dragEnd={dragEnd}
            componentProps={props}
        >
            {children}
        </DraggableDndKitImplementation>
}));

export const DraggableRenderMethod: <DragData extends RequiredDragData,>(props: DraggableRenderMethodParams<DragData>, ref: ForwardedRef<any>) => ReactNode
= observer(forwardRef<any, DraggableParams<any>>(({
    render,
    draggedPresentation,
    dragStart,
    dragEnd,
    itemData,
    useHandle=false,
    droppable=false,
    actionTitle="Drag item",
    ...props
}, ref) => {
    return <DraggableDndKitRenderMethodImplementation
            ref={ref}
            render={render}
            actionTitle={actionTitle}    
            useHandle={useHandle}
            droppable={droppable}
            draggedPresentation={draggedPresentation}
            itemData={itemData}
            dragStart={dragStart}
            dragEnd={dragEnd}
            componentProps={props}
        />
}));


export type DndKitDroppableData<DropData extends RequiredDropData> = {
    id: any,
    element: Element | undefined, 
    type: any, 
    data: DropData,
} | null;

export type DndKitDragOperation = {
    canceled: boolean,
    position: any,
    transform: {x: number, y: number},
    status: any,
    source: DndKitDraggableData<any>,
    target: DndKitDroppableData<any>,
} | null;


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
export const Droppable: <DropData extends RequiredDropData,>(props: DroppableParams<DropData> & {children: ReactNode}, ref: ForwardedRef<any>) => ReactNode 
    = observer(forwardRef<any, DroppableParams<any>>((props, ref) => {
        return <DroppableDndKitImplementation
            ref={ref}
            {...props}
    />}))

export const DroppableRenderMethod: <DropData extends RequiredDropData,>(props: DroppableRenderMethodParams<DropData>, ref: ForwardedRef<any>) => ReactNode 
    = observer(forwardRef<any, any>((props, ref) => {
        return <DroppableDndKitRenderMethodImplementation
            ref={ref}
            {...props}
    />
}))

export type DragCallbacks<DragData extends RequiredDragData, DropData extends RequiredDropData> = {
        setDataWhenDragOver: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        saveDataWhenDragEnds: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        resetDataWhenDragOff:({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragEnd?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragOver?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragCancel?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragStart?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
        dragMove?: ({drag, drop, e}: FormattedDragDropEventData<DragData, DropData>) => void,
}

 type CallbackMap<DropData extends RequiredDropData> = {
    [key in keyof Partial<DragStringTypesToDragDataType>]: DragCallbacks<DragStringTypesToDragDataType[key], DropData>;
} & {
    [key: string]: DragCallbacks<any, DropData>;
}
// Params droppable items must supply
export type DroppableParams<DropData extends RequiredDropData> = {
    callbacksForAcceptedDragTypes: CallbackMap<DropData>,
    itemData: DropData,
    collisionPriority?: number,
} & ComponentPropsWithoutRef<any>;

export type DroppableRenderMethodParams<DropData extends RequiredDropData> = DroppableParams<DropData> & {
    render: ForwardRefRenderFunction<any, any>
}
