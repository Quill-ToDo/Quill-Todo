import {
    ClientRect,
    DndContext, 
    DragEndEvent,  
    DragOverlay,  
    DragStartEvent,  
    Modifier,  
    PointerSensor,    
    PointerSensorProps,    
    useDndMonitor,  
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {Transform} from '@dnd-kit/utilities';
import React, { 
    ReactNode, 
    useId, 
    PointerEvent,
    useState, 
    ComponentPropsWithoutRef,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
    forwardRef,
    ReactElement,
    ForwardedRef,
} from 'react';
import { 
    DragEventData, 
    DraggableParams, 
    DroppableParams,
    DropEventData, } from '@util/Draggable';
import { combineClassNamePropAndString } from '@util/jsTools';
import { clickedInBounds, searchThroughParents } from '@util/jsTools';
import { observer } from 'mobx-react-lite';
import { 
    DRAGGABLE_CONTAINER_CLASS, 
    DRAGGABLE_HANDLE_CLASS, 
    LIGHT_SECTION_CLASS, 
    LOADING_CLASS, 
    PADDING_CLASS, 
    POPUP_POSITIONER_CLASS, 
    ROUND_CORNERS_CLASS, 
} from '../@util/constants';
import { useMergeRefs } from '@floating-ui/react';
import { RequiredDragData, RequiredDropData } from '../@util/DraggableTypes';
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
    const {dragOverlay, isDragging, position, draggedOverValidTarget } = useContext(DraggableContext); 
    const modifiers: any = [];
    const { draggedContent } = dragOverlay;
    // Use content from nearest drag context to render dragged content in a drag overlay

    // TODO how to make drag overlay container class take the classes of the real div...
    // Drag overlay should always be mounted and content within should be conditionally rendered
    return (
    <DragOverlay 
            dropAnimation={null}
            modifiers={modifiers}
            className='drag-overlay'
            >
            <div 
                className={`${DRAGGABLE_CONTAINER_CLASS} ${isDragging && draggedOverValidTarget ? "valid" : "invalid"}`}
                {...(position && {style: {transform: translate(position.x, position.y)}})}
    >
                { isDragging && draggedContent ? 
                    draggedContent 
                    : <div className={`${LIGHT_SECTION_CLASS} ${ROUND_CORNERS_CLASS} ${PADDING_CLASS} ${LOADING_CLASS}`}>
                        <p className='jiggle'>
                            Loading...
                        </p>
                    </div>
                }
            </div>
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
    // Modifiers can be applied to drag overlay
    // Sensors can only be applied to dnd context
    const [dragOverlay, setDragOverlay] = useState<DraggedOverlayData>({draggedContent: null, anchorId: null});
    const [draggedOverValidTarget, setDraggedOverValidTarget] = useState<boolean>(false);
    const [position, setPosition] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const pointerSensor = useSensor(PointerSensor);
    const dragHandleSensor = useSensor(DragHandleSensor, {
        activationConstraint: {
            distance: 10,
        }
    });
    const modifiers: Modifier[] = [];
    const sensorsToUse = [];
    
    sensorsToUse.push(pointerSensor);
    sensorsToUse.push(dragHandleSensor);
    
    const sensors = useSensors(...sensorsToUse);
    return <DraggableContext.Provider value={{
            dragOverlay, 
            setDragOverlay, 
            position,
            setPosition, 
            isDragging,
            draggedOverValidTarget,
            setDraggedOverValidTarget,
        }}
    >
        <DndContext 
            modifiers={modifiers}
            sensors={sensors}
            autoScroll={false}
            onDragStart={(e) => {
                setIsDragging(true);
            }}
            onDragEnd={(e) => {
                setIsDragging(false);
            }}
            >
            { children }
        </DndContext>
    </DraggableContext.Provider>;
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

    const sharedDragStart: DragOptions<any>["sharedDragStart"] = (e, callback) => {
        startDragIfIdMatchesDraggedId(id, e, (props) => {
            // Set drag overlay content to be that of the actual item
            setDragOverlay && setDragOverlay({draggedContent: draggedContent as ReactElement, anchorId: id});
            callback && callback(props, () => {
                dragStart && dragStart(props);
            });
        })
    }

    const sharedDragEnd: DragOptions<any>["sharedDragEnd"] = (e, callback) => {
        endDragIfIdMatchesDraggedId(id, e as DragEndEvent, (props) => {
            setDragOverlay && setDragOverlay({draggedContent: null, anchorId: null});
            callback && callback(props, () => {
                dragEnd && dragEnd(props);
            });
        })
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
    sharedDragStart: (e: DragStartEvent, callback?: (data: DragData, after: () => void ) => void) => void,
    sharedDragEnd: (e: DragEndEvent, callback?: (data: DragData, after: () => void) => void) => void,
    itemData: DragData,
} & ComponentPropsWithoutRef<any>;

/**
 * DND Kit implementation of a freely draggable element that stays where it is last moved to. 
 * @returns 
 */
const FreelyDraggable = observer(forwardRef(({
    children,
    id,
    itemData,
    sharedDragStart, 
    sharedDragEnd,
    ...props
}: DragOptions<any>, forwardedRef): ReactNode => {
    const { setPosition: setPopupPosition } = useContext(DraggableContext);
    const [startingCoords, setStartingCoords] = useState<null | {x: number, y: number}>(null);
    const [itemIsBeingDragged, setItemIsBeingDragged] = useState(false);
    
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        attributes: {
            role: "generic",
        },
        data: itemData,
    });
    const ref = useMergeRefs([setNodeRef, forwardedRef]);
    /// Render the draggable item with drag start and end listeners, 
    // when drag starts use dragContext to set content for a dragOverlay rendered elsewhere. Hide the actual element. Set the dragged content to be the  
    // correct element and set a starting position as necessary. 
    // When drag ends, update the position of the actual element to be where the drag ended and unhide it. 

    useDndMonitor({
        onDragStart(e) {
            sharedDragStart(e, ({after}) => {
                if (e.active && e.active.id === id) {
                    setItemIsBeingDragged(true);
                    // Set the starting coords of the drag and dragOverlay element to be where the item starts being dragged from
                    const draggedContentElement = document.getElementById(id); 
                    if (!!draggedContentElement) {
                        const topLeftCornerOfElementBeforeDrag = numbersFromTranslate(draggedContentElement.style.transform);
                        if (topLeftCornerOfElementBeforeDrag.x !== 0 || topLeftCornerOfElementBeforeDrag.y !== 0) {
                            // Set starting position of drag overlay to be where the real item is
                            setPopupPosition && setPopupPosition(topLeftCornerOfElementBeforeDrag);       
                            setStartingCoords(topLeftCornerOfElementBeforeDrag);
                            after && after();
                        }
                    } 
                }
            });
        },
        onDragEnd(e) {
            sharedDragEnd(e, ({after}) => {
                setItemIsBeingDragged(false);
                // Move the actual HTML element (not overlay) to the ending position of the DragOverlay and make it visible
                if (e.active.rect.current.translated) {
                    const translated = {x: e.active.rect.current.translated.left, y: e.active.rect.current.translated.top}
                    setPopupPosition && setPopupPosition(null);
                    setStartingCoords(translated);
                    after && after();
                }
            })
        },
    })

    // Hide the actual item when the drag overlay is not rendered
    return itemIsBeingDragged ? <></> : <div
            id={id}
            ref={ref}
            {...props}
            {...listeners}
            {...attributes}
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
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        attributes: {
            role: "button",
        },
        data: itemData,  
    });
    const ref = useMergeRefs([forwardedRef, setNodeRef]);
    useDndMonitor({
        onDragStart: (e) => {
            sharedDragStart(e, () => {});
        },
        onDragEnd: sharedDragEnd,
        onDragOver: (e) => {
            endDragIfIdMatchesDraggedId(id, e, ({drop}: {drop: RequiredDropData}) => {
                if (itemData && drop && drop.accepts && setDraggedOverValidTarget) {
                    setDraggedOverValidTarget(drop.accepts.includes(itemData.type));
                }
            });
        }
    });

    return <div
        {...props}
        ref={ref}
        id={id}
        {...attributes}
        {...listeners}
    >
        { children }
    </div>;
}));


/**
 * Check if this element is the one being dragged, and if so, pass on any drag and drop data
 * @param draggedElementId 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const endDragIfIdMatchesDraggedId = (draggedElementId: string, e: DragEndEvent, onDragEnd: (data: DropEventData<any, any>) => void) => {
    const {active, over} = e;
    if (e.active.id !== draggedElementId) {
        return;
    }
    const droppableData = over ? over.data.current : null;
    const draggedData = active.data.current;
    onDragEnd && onDragEnd({e, drag: draggedData, drop: droppableData});
}

/**
 * Check if this element is the one being dragged, and if so, execute the callback
 * @param targetElementId 
 * @param e 
 * @param onDragStart 
 * @returns 
 */
const startDragIfIdMatchesDraggedId = (targetElementId: string, e: DragStartEvent, onDragStart: (data: DragEventData<any>) => void) => {
    const {active} = e;
    if (active.id !== targetElementId) {
        return;
    }
    const draggedData = active.data.current;
    onDragStart && onDragStart({drag: draggedData, e});
}

/**
 * Check if this element is the one with something dropping on it, and if so, pass on any drag and drop data
 * @param draggedElementId 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const dropIfIdMatchesDroppedId = (droppedElementId: string, e: DragEndEvent, onDragEnd: (data: DropEventData<any, any>) => void) => {
    const {active, over} = e;
    if (!e.over || e.over.id !== droppedElementId) {
        return;
    }
    const droppableData = over ? over.data.current : null;
    const draggedData = active.data.current;
    onDragEnd && onDragEnd({e, drag: draggedData, drop: droppableData});
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
    const {setNodeRef, isOver} = useDroppable({
        // element: forwardedRef,
        // collisionPriority: collisionPriority, 
        id: id,
        data: {
                ...itemData,
                accepts: acceptedItemTypes,
        }
    });
    const ref = useMergeRefs([setNodeRef, forwardedRef])

    useDndMonitor({
        onDragOver(e) {
            dropIfIdMatchesDroppedId(id, e, (data) => {
                const {active, over} = e;
                const droppableData = over ? over.data.current : null;
                const draggedData = active.data.current;
                if (droppableData && draggedData && droppableData.accepts.includes(draggedData.type)) {
                    setValidDropTarget(true)
                    const callbacks = callbacksForAcceptedDragTypes[draggedData.type];
                    callbacks.dragOver && callbacks.dragOver(data);
                    draggedData.showDropPreview && callbacks.setDataWhenDragOver && callbacks.setDataWhenDragOver(data);
                } else {
                    setValidDropTarget(false);
                }
            })
        },
        onDragEnd(e) {
            dropIfIdMatchesDroppedId(id, e, (data) => {
                // Dropped on this droppable spot
                // Do i need to check both drag and drop types?
                if (validDropTarget) {
                    const callbacks = callbacksForAcceptedDragTypes[data.drag.type];
                    callbacks && callbacks.dragEnd && callbacks.dragEnd(data);
                    callbacks.saveDataWhenDragEnds && callbacks.saveDataWhenDragEnds(data);
                }
            })
        },
        onDragCancel(e) {
            dropIfIdMatchesDroppedId(id, e, (data) => {
                // TODO cancelled on this sroppable spot??
                const callbacks = callbacksForAcceptedDragTypes[data.drag.type];
                callbacks && callbacks.dragCancel && callbacks.dragCancel(data);
                callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff(data);
            })
        },
        onDragMove(e) {
            // Something was dragged
            const drag = e.active.data.current; 
            if (drag) {
                const callbacks = callbacksForAcceptedDragTypes[drag.type];
                if (callbacks) {
                    callbacks.dragMove && callbacks.dragMove({drag, drop: (e.over ? e.over.data.current : null), e: e});
                    drag.showDropPreview && callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag, drop: (e.over ? e.over.data.current : null), e: e});
                }
            }
        },
        onDragStart(e) {
            // If something was dragging, call drag start for the droppable if it was provided
            const drag = e.active.data.current; 
            if (drag) {
                const callbacks = callbacksForAcceptedDragTypes[drag.type];
                callbacks && callbacks.dragStart && callbacks.dragStart({drag: drag, drop: null, e});
            }
        },
    })

    return <div
        ref={ref}
        {...props}
        id={id}
        className={combineClassNamePropAndString(`droppable${isOver ? (validDropTarget ? " valid" : " invalid") : ""}`, props)}
    >
        {children}
    </div> 
}));

//endregion Droppable
//#region Modifers
function restrictToDragHandleClass(args: any): Transform {
    const {
        transform,
        activatorEvent,
    } = args;
    const noMove = {...transform, x: 0, y: 0};
    if (activatorEvent && activatorEvent.explicitOriginalTarget) {
        const target = activatorEvent.explicitOriginalTarget as HTMLElement;
        if (target.classList && target.classList.contains(DRAGGABLE_HANDLE_CLASS)) {
            return transform;
        } 

    }
    return noMove;
}

function restrictToView(args: any): Transform {
    const {
        transform, 
        draggingNodeRect,
        windowRect,
    } = args;

    if (draggingNodeRect && windowRect) {
        return restrictToBoundingRect(transform as Transform, draggingNodeRect as ClientRect, windowRect as ClientRect);
    }
    return transform;
}

function restrictToBoundingRect(
    transform: Transform,
    rect: ClientRect,
    boundingRect: ClientRect
): Transform {

    const value = {...transform,};
  
    if (rect.top + transform.y <= boundingRect.top) {
        value.y = boundingRect.top - rect.top;
    } else if (
        rect.bottom + transform.y >= boundingRect.bottom
    ) {
        value.y = boundingRect.top + boundingRect.height - rect.bottom;
    }
  
    // OOB on left
    if (rect.left + transform.x <= boundingRect.left) {
        value.x = boundingRect.left - rect.left;
    // OOB on right
    } else if (
        rect.right + transform.x >= boundingRect.right
    ) {
        value.x = boundingRect.right - rect.right;
    }
  
    return value;
  }
//#endregion Modifers
//#region Sensors
/**
 * Activates when the user clicks on an element with DRAGGABLE_HANDLE_CLASS or a parent element with DRAGGABLE_HANDLE_CLASS
 */
class DragHandleSensor extends PointerSensor {
    constructor(manager: PointerSensorProps) {
        super(manager);
    }
    static activators = [
        {
            eventName: "onPointerDown" as const,
            handler: ({nativeEvent: event}: PointerEvent) => {
                // Iterate through parents until you find the one with DRAGGABLE_CLASS (top draggable parent)
                // and see if the user has clicked on the same spot as an element with DRAGGABLE_HANDLE_CLASS
                const thisOrParentElementIsDraggable = !!searchThroughParents({
                    start: event.target as HTMLElement,
                    successCondition: (node) => node.classList.contains(DRAGGABLE_HANDLE_CLASS) 
                        && clickedInBounds(node.getClientRects()[0], event.clientX, event.clientY),
                    failCondition: (node) => {
                        const reachedParentDraggableNode = node.classList.contains(DRAGGABLE_CONTAINER_CLASS) && !node.classList.contains(DRAGGABLE_HANDLE_CLASS);
                        return reachedParentDraggableNode;
                    }
                });
                return !!(event.isPrimary && thisOrParentElementIsDraggable);
            },
        },
    ];
}

  //#endregionSensors