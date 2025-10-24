import {
    DragOverlay,  
    useDragDropMonitor,
    PointerSensor,    
    useDraggable,
    useDroppable,
    KeyboardSensor,
    DragDropProvider,
} from '@dnd-kit/react';
import React, { 
    ReactNode, 
    useId, 
    useState, 
    ComponentPropsWithoutRef,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
    forwardRef,
    ReactElement,
    ForwardedRef,
    MutableRefObject,
} from 'react';
import { 
    FormattedDragDropEventData, 
    DraggableParams, 
    DroppableParams, } from '@util/Draggable';
import { combineClassNamePropAndString } from '@util/jsTools';
import { observer } from 'mobx-react-lite';
import { 
    DRAGGABLE_CONTAINER_CLASS, 
    DRAGGABLE_HANDLE_CLASS, 
    POPUP_POSITIONER_CLASS,
} from '../@util/constants';
import { RequiredDragData, RequiredDropData } from '../@util/DraggableTypes';
import { useMergeRefs } from '@floating-ui/react';
const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;
const numbersFromTranslate = (s: String) => {
    const x = Number(s.substring(s.indexOf("(")+1, s.indexOf("px")));
    const withoutX = s.substring(s.indexOf("px")+3).trim();
    const y = Number(withoutX.substring(0, withoutX.indexOf("px")));
    return {
        x: x,
        y: y,
    }
}

// Use drag overlay and context and positioning divs to handle a draggable element.
// On render:
//   - Drag overlay is rendered but content is not shown
//   - Real element is shown, positioned by positioner div. (If positioned by floating UI it will change the positioner)
// On drag start:
//   - Real element is hidden 
//   - Drag overlay positioner translated to where the real elements positioning div is
//   - Drag overlay content is shown and positioner div is translated as it is dragged
// On drag end:
//   - Positioning div for the real element is set to where the drag overlay elements positioner top left corner ended up
//   - Drag overlay content is hidden

//#region Context
type DraggedOverlayData = { draggedContent: ReactElement | null, anchorId: string | null };
export const DraggableContext = createContext<{
    dragOverlay: DraggedOverlayData, 
    setDragOverlay: null | Dispatch<SetStateAction<DraggedOverlayData>>,
    draggedOverValidTarget: boolean,
    setDraggedOverValidTarget: null | Dispatch<SetStateAction<boolean>>,
    position: null | {x: number, y: number},
    setPosition: null | Dispatch<SetStateAction<{x: number, y: number} | null>>, 
    isDragging: boolean,
}>({
    draggedOverValidTarget: false,
    setDraggedOverValidTarget: null,
    dragOverlay: {draggedContent: null, anchorId: null}, 
    setDragOverlay: null,
    position: null,
    setPosition: null,
    isDragging: false,
});

/**
 * This is the content rendered on the drag preview layer/overlay. It should always be mounted
 * @returns 
 */
export const DraggingContent = observer(() => {
    const {dragOverlay, position, draggedOverValidTarget } = useContext(DraggableContext); 
    const { draggedContent } = dragOverlay;
    // Use content from nearest drag context to render dragged content in a drag overlay

    // TODO how to make drag overlay container class take the classes of the real div...
    // Drag overlay should always be mounted and content within should be conditionally rendered
    return (
        <DragOverlay 
            className='drag-overlay'
            >
                { (source) => <div 
                    className={`${source.element?source.element.className:""} ${DRAGGABLE_CONTAINER_CLASS} ${draggedOverValidTarget && source.isDropping ? "valid" : "invalid"}`}
                    {...(position && {style: {transform: translate(position.x, position.y)}})}
        >
                    { source.isDragging && draggedContent ? 
                        draggedContent 
                    : <></>
                    }
            </div>}
        </DragOverlay>
    ) 
})


/**
 * Wrap passed content with Dnd context provider so that we can change the 
 * content of the drag overlay
 */
export const WrapWithDndContext = observer(({
    children,
}: {
    children: ReactNode,
}) => {
    const [dragOverlay, setDragOverlay] = useState<DraggedOverlayData>({draggedContent: null, anchorId: null});
    const [draggedOverValidTarget, setDraggedOverValidTarget] = useState<boolean>(false);
    const [position, setPosition] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const sensorsToUse = [PointerSensor.configure({
        activationConstraints: {
            distance: {value: 10},
        }
    }), KeyboardSensor];
        
    return (
    <DragDropProvider
            sensors={sensorsToUse}
            onDragStart={(e) => {
                setIsDragging(true);
            }}
            onDragEnd={(e) => {
                setIsDragging(false);
            }}
        >
                <DraggableContext.Provider value={{
                        dragOverlay, 
                        setDragOverlay, 
                        position,
                        setPosition, 
                        isDragging,
                        draggedOverValidTarget,
                        setDraggedOverValidTarget,
                    }}
                >
            { children }
        </DraggableContext.Provider>
     </DragDropProvider>
    )
});
//#endregion Context
//region Draggable
/**
 * DND Kit implementation of a draggable element. If useHandle=true, some element within the draggable content should have the class
 * DRAGGABLE_HANDLE_CLASS
 * @returns 
 */
export const DraggableDndKitImplementation = observer(forwardRef(({ 
    children,
    draggedPresentation,
    mayBeDropped, 
    actionTitle,
    positioningProps,
    useHandle,
    dragStart,
    dragEnd,
    itemData, 
} : DraggableParams<any>, ref) => {
    const id = useId();
    const { setDragOverlay } = useContext(DraggableContext);
    
    // Add positioner class and popup handle class to entire element if not specified to use a handle
    const sharedPositioningProps = {
        ...positioningProps,
        className: combineClassNamePropAndString(`${POPUP_POSITIONER_CLASS}${useHandle?"":" " + DRAGGABLE_HANDLE_CLASS}`, positioningProps),
        id: id,
        "aria-label": actionTitle,
    };
    // Use a different draggable presentation if provided, otherwise default to the same presentation as the 
    // draggable item
    const draggedContent = draggedPresentation ?
       draggedPresentation
        : children;

    const sharedDragStart: DragOptions<any>["sharedDragStart"] = (props) => {
        continueIfThisElementDragging({...props, callbackIfValid: (data) => {
            // Set drag overlay content to be that of the actual item
            setDragOverlay && setDragOverlay({draggedContent: draggedContent as ReactElement, anchorId: id});
            dragStart && dragStart(data);
            props.callbackIfValid && props.callbackIfValid(data);
        }})
    }

    const sharedDragEnd: DragOptions<any>["sharedDragEnd"] = (props) => {
        continueIfThisElementDragging({...props, callbackIfValid: (data) => {
            setDragOverlay && setDragOverlay({draggedContent: null, anchorId: null});
            dragEnd && dragEnd(data);
            props.callbackIfValid && props.callbackIfValid(data);
        }})
    }

    return (
        mayBeDropped 
            ? <PickUpAndMove
                {...sharedPositioningProps}
                ref={ref}
                id={id}
                sharedDragStart={sharedDragStart}
                sharedDragEnd={sharedDragEnd}
                itemData={itemData}
                >
                {children}
            </PickUpAndMove>
            : 
            <FreelyDraggable 
                {...sharedPositioningProps}
                ref={ref}
                id={id}
                sharedDragStart={sharedDragStart}
                sharedDragEnd={sharedDragEnd}
                itemData={itemData}
            >
                {children}
            </FreelyDraggable> )
}));

// The subset of props required in both free drag and "pick up and move item" implementations
type DragOptions<DragData extends RequiredDragData> = {
    children: ReactNode,
    id: string,
    sharedDragStart: (props: DndItemsNeededForAbstraction) => void,
    sharedDragEnd: (props: DndItemsNeededForAbstraction) => void,
    itemData: DragData,
} & ComponentPropsWithoutRef<any>;

/**
 * DND Kit implementation of a freely draggable element that stays where it is last moved to. 
 * @returns 
 */
const FreelyDraggable = observer(forwardRef<any, DragOptions<any>>(({
    children,
    id,
    itemData,
    sharedDragStart, 
    sharedDragEnd,
    ...props
}, forwardedRef): ReactNode => {
    const { setPosition: setPopupPosition } = useContext(DraggableContext);
    const [startingCoords, setStartingCoords] = useState<null | {x: number, y: number}>(null);
    const [itemIsBeingDragged, setItemIsBeingDragged] = useState(false);
    const {ref} = useDraggable({
        id: id,
        data: itemData,
    });
    const merged = useMergeRefs([ref, forwardedRef]);
    /// Render the draggable item with drag start and end listeners, 
    // when drag starts use dragContext to set content for a dragOverlay rendered elsewhere. Hide the actual element. Set the dragged content to be the  
    // correct element and set a starting position as necessary. 
    // When drag ends, update the position of the actual element to be where the drag ended and unhide it. 

    useDragDropMonitor({
        onDragStart(e, manager) {
            sharedDragStart({targetElementId: id, operation: e.operation, callbackIfValid: ({drag}: FormattedDragDropEventData<any, any>) => {
                setItemIsBeingDragged(true);
                // TODO might be able to update this to use new dnd kit options and not query the document
                // Set the starting coords of the drag and dragOverlay element to be where the item starts being dragged from
                const draggedContentElement = document.getElementById(id); 
                if (!!draggedContentElement) {
                    const topLeftCornerOfElementBeforeDrag = numbersFromTranslate(draggedContentElement.style.transform);
                    if (topLeftCornerOfElementBeforeDrag.x !== 0 || topLeftCornerOfElementBeforeDrag.y !== 0) {
                        // Set starting position of drag overlay to be where the real item is
                        setPopupPosition && setPopupPosition(topLeftCornerOfElementBeforeDrag);       
                        setStartingCoords(topLeftCornerOfElementBeforeDrag);
                    }
                }
            }});
        },
        onDragEnd(e, manager) {
            sharedDragEnd({targetElementId: id, operation: e.operation, callbackIfValid: ({drag}: FormattedDragDropEventData<any, any>) => {
                setItemIsBeingDragged(false);
                // const final = op.position;
                const final = e.operation.position;
                // Move the actual HTML element (not overlay) to the ending position of the DragOverlay and make it visible
                if (drag && final) {
                    // TODO this seems to be moving to where the cursor ended up and not where the element ended up
                    const translated = {x: final.current.x, y: final.current.y}
                    setPopupPosition && setPopupPosition(null);
                    setStartingCoords(translated);
                }
            }})
        },
    })

    // Hide the actual item when the drag overlay is not rendered
    return itemIsBeingDragged ? <></> : <div
            id={id}
            ref={merged}
            {...props}
            {
                // Set the position of the actual element not while dragging
                ...(startingCoords && {style: {transform: translate(startingCoords.x, startingCoords.y)}})
            }
            >
        {children}
    </div>;
}));

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndMove = observer(forwardRef(({
    children,
    id,
    sharedDragStart,
    sharedDragEnd,
    itemData,
    ...props
}: DragOptions<any>, forwardedRef: ForwardedRef<any>) => {
    const { setDraggedOverValidTarget } = useContext(DraggableContext);
    const { ref } = useDraggable({
        id: id,
        data: itemData,  
    });
    const merged = useMergeRefs([forwardedRef, ref])

    useDragDropMonitor({
        onDragStart: (e, manager) => {
            sharedDragStart({operation: e.operation, targetElementId: id, callbackIfValid: () => {}});
        },
        onDragEnd: (e, manager) => {
            sharedDragEnd({operation: e.operation, targetElementId: id, callbackIfValid: () => {}});
        },
        onDragOver: (e, manager) => {
            continueIfThisElementDragging({targetElementId: id, operation: e.operation, callbackIfValid: ({drop}) => {
                if (itemData && drop && drop.accepts && setDraggedOverValidTarget) {
                    setDraggedOverValidTarget(drop.accepts.includes(itemData.type));
                }
            }});
        }
    });

    return <div
        {...props}
        ref={merged}
        id={id}
    >
        { children }
    </div>;
}));

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

export type DndKitDroppableData<DropData extends RequiredDropData> = {
    id: any,
    element: Element | undefined, 
    type: any, 
    data: DropData,
} | null;

export type DndKitDragOperation = {
    activatorEvent: Event | null,
    canceled: boolean,
    position: any,
    transform: {x: number, y: number},
    status: any,
    source: DndKitDraggableData<any>,
    target: DndKitDroppableData<any>,
} | null;

type DndItemsNeededForAbstraction = {
    targetElementId: string, 
    operation: DndKitDragOperation, 
    callbackIfValid: (data: FormattedDragDropEventData<RequiredDragData, RequiredDropData>) => void
}
/**
 * Check if this element is the one being dragged, and if so, pass on any drag and drop data. 
 * Changing the data type of the returned data is meant to abstract away some of the particularities of how dndKit stores data, so that if that
 * shape changes we only have to change this method, hopefully.
 * @param draggedElementId 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const continueIfThisElementDragging = <DragData extends RequiredDragData, DropData extends RequiredDropData>({operation, targetElementId, callbackIfValid}: DndItemsNeededForAbstraction) => {
    if (operation) {
        const droppable = operation.target;
        const dragged = operation.source;
        if (!dragged || dragged.id !== targetElementId) {
            return;
        }
        const data: FormattedDragDropEventData<DragData, DropData> = {e: {isDragging: !!(dragged && dragged.isDragging)}, drag: dragged.data, drop: droppable ? droppable.data : null}; 
        callbackIfValid && callbackIfValid(data);
    }
}

/**
 * Check if this element is the one with something dropping on it, and if so, pass on any drag and drop data
 * @param draggedElementId 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const continueIfThisElementDroppedOnto = ({operation, targetElementId, callbackIfValid} : DndItemsNeededForAbstraction) => {
    if (operation) {
        const droppable = operation.target;
        const dragged = operation.source;
        if (!droppable || droppable.id !== targetElementId) {
            // This is not the same element that called this method
            return;
        }
        const data: FormattedDragDropEventData<RequiredDragData, RequiredDropData> = {drag: dragged ? dragged.data : null, drop: droppable.data, e: { isDragging: !!(dragged && dragged.isDragging)}}; 
        callbackIfValid && callbackIfValid(data);
    }
}

//endregion Draggable
//region Droppable
/**
 * DND Kit implementation of a droppable element. 
 * @returns 
 */
export const DroppableDndKitImplementation = observer(forwardRef<any, DroppableParams<RequiredDropData & any>>(({
    children, 
    itemData, 
    callbacksForAcceptedDragTypes, 
    collisionPriority,
    ...props
},
 forwardedRef) => {
    const id = useId();
    const [validDropTarget, setValidDropTarget] = useState(false);
    const acceptedItemTypes = Object.keys(callbacksForAcceptedDragTypes);
    const {ref, isDropTarget} = useDroppable({
        element: forwardedRef as MutableRefObject<any>,
        collisionPriority: collisionPriority, 
        id: id,
        data: {
            ...itemData,
            accepts: acceptedItemTypes,
        }
    });

    useDragDropMonitor({
        onDragOver(e, manager) {
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, callbackIfValid: ({drag, drop, e}: FormattedDragDropEventData<RequiredDragData, RequiredDropData>) => {
                if (drop && drag && drop.accepts.includes(drag.type)) {
                    const draggedData = drag;
                    setValidDropTarget(true)
                    const callbacks = callbacksForAcceptedDragTypes[draggedData.type];
                    callbacks.dragOver && callbacks.dragOver({drag, drop, e});
                    draggedData.showDropPreview && callbacks.setDataWhenDragOver && callbacks.setDataWhenDragOver({drag, drop, e});
                } else {
                    setValidDropTarget(false);
                }
            }})
        },
        onDragEnd(e, manager) {
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, callbackIfValid: ({drag, drop, e}) => {
                // Dropped on this droppable spot
                if (validDropTarget && drag) {
                    const callbacks = callbacksForAcceptedDragTypes[drag.type];
                    callbacks && callbacks.dragEnd && callbacks.dragEnd({drag, drop, e});
                    callbacks.saveDataWhenDragEnds && callbacks.saveDataWhenDragEnds({drag, drop, e});
                }
                // TODO: If cancelled
                // dropIfIdMatchesDroppedId(id, e, (data) => {
                //     // TODO cancelled on this sroppable spot??
                //     const callbacks = callbacksForAcceptedDragTypes[data.drag.type];
                //     callbacks && callbacks.dragCancel && callbacks.dragCancel(data);
                //     callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff(data);
                // })
            }})
        },
        onDragMove(e, manager) {
            // Something was dragged
            const drag = e.operation.source; 
            const drop = e.operation.target; 
            if (drag) {
                const callbacks = callbacksForAcceptedDragTypes[drag.data.type];
                if (callbacks) {
                    callbacks.dragMove && callbacks.dragMove({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
                    drag.data.showDropPreview && callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
                }
            }
        },
        onDragStart(e, manager) {
            // If something was dragging, call drag start for the droppable if it was provided
            const drag = e.operation.source; 
            if (drag) {
                const callbacks = callbacksForAcceptedDragTypes[drag.data.type];
                callbacks && callbacks.dragStart && callbacks.dragStart({drag: drag.data as RequiredDragData, drop: null, e: {isDragging: drag.isDragging}});
            }
        },
    })

    return <div
        ref={ref}
        {...props}
        id={id}
        className={combineClassNamePropAndString(`droppable${isDropTarget ? (validDropTarget ? " valid" : " invalid") : ""}`, props)}
    >
        {children}
    </div> 
}));

//endregion Droppable
//#region Modifers
// function restrictToView(args: any): Transform {
//     const {
//         transform, 
//         draggingNodeRect,
//         windowRect,
//     } = args;

//     if (draggingNodeRect && windowRect) {
//         return restrictToBoundingRect(transform as Transform, draggingNodeRect as any, windowRect as any);
//     }
//     return transform;
// }

// function restrictToBoundingRect(
//     transform: Transform,
//     rect: any,
//     boundingRect: any
// ): Transform {

//     const value = {...transform,};
  
//     if (rect.top + transform.y <= boundingRect.top) {
//         value.y = boundingRect.top - rect.top;
//     } else if (
//         rect.bottom + transform.y >= boundingRect.bottom
//     ) {
//         value.y = boundingRect.top + boundingRect.height - rect.bottom;
//     }
  
//     // OOB on left
//     if (rect.left + transform.x <= boundingRect.left) {
//         value.x = boundingRect.left - rect.left;
//     // OOB on right
//     } else if (
//         rect.right + transform.x >= boundingRect.right
//     ) {
//         value.x = boundingRect.right - rect.right;
//     }
  
//     return value;
//   }
// //#endregion Modifers
// //#region Sensors
// /**
//  * Activates when the user clicks on an element with DRAGGABLE_HANDLE_CLASS or a parent element with DRAGGABLE_HANDLE_CLASS
//  */
// class DragHandleSensor extends PointerSensor {
//     static activators = [
//         {
//             eventName: "onPointerDown" as const,
//             handler: ({nativeEvent: event}: PointerEvent) => {
//                 // Iterate through parents until you find the one with DRAGGABLE_CLASS (top draggable parent)
//                 // and see if the user has clicked on the same spot as an element with DRAGGABLE_HANDLE_CLASS
//                 const thisOrParentElementIsDraggable = !!searchThroughParents({
//                     start: event.target as HTMLElement,
//                     successCondition: (node) => node.classList.contains(DRAGGABLE_HANDLE_CLASS) 
//                         && clickedInBounds(node.getClientRects()[0], event.clientX, event.clientY),
//                     failCondition: (node) => {
//                         const reachedParentDraggableNode = node.classList.contains(DRAGGABLE_CONTAINER_CLASS) && !node.classList.contains(DRAGGABLE_HANDLE_CLASS);
//                         return reachedParentDraggableNode;
//                     }
//                 });
//                 return !!(event.isPrimary && thisOrParentElementIsDraggable);
//             },
//         },
//     ];
// }

  //#endregionSensors