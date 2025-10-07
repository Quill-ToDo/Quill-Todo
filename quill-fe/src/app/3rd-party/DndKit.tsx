import {
    ClientRect,
    closestCenter,
    DndContext, 
    DragEndEvent, 
    DragOverlay,  
    DragStartEvent,  
    Modifier,  
    PointerSensor,    
    useDndMonitor,  
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {Transform} from '@dnd-kit/utilities';
import React, { 
    MutableRefObject, 
    ReactNode, 
    useId, 
    useRef, 
    PointerEvent,
    useState, 
    ComponentPropsWithoutRef,
    ForwardedRef,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
    forwardRef,
    ReactElement,
} from 'react';
import { 
    DragDropData, 
    DragDropEventData, 
    DraggableParams, 
    DroppableParams, 
    INTERACTABLE_ELEMENT_CLASS} from '@util/Draggable';
import { combineClassNamePropAndString } from '@util/jsTools';
import { clickedInBounds, searchThroughParents } from '@util/jsTools';
import { observer } from 'mobx-react-lite';
import { DRAGGABLE_CONTAINER_CLASS, DRAGGABLE_HANDLE_CLASS, POPUP_POSITIONER_CLASS, } from '../@util/constants';
import { useMergeRefs } from '@floating-ui/react';
import { POPUP_CLASS } from '../@util/Popup';
const DRAG_POSITIONER_ID = "drag-id";
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
export const DraggableContext = createContext<{
    content: null | ReactElement, 
    setContent: null | Dispatch<SetStateAction<ReactElement | null>>,
    position: null | {x: number, y: number},
    setPosition: null | Dispatch<SetStateAction<{x: number, y: number} | null>>, 
    isDragging: boolean,
}>({
    content: null, 
    setContent: null,
    position: null,
    setPosition: null,
    isDragging: false,
});

/**
 * This is the content rendered on the drag preview layer/overlay. It should alwqays be mounted
 * @returns 
 */
export const DraggingContent = observer(() => {
    const context = useContext(DraggableContext); 
    const dragged = context.content; 
    const modifiers: any = [];
    // Use content from nearest drag context to render dragged content in a drag overlay

    // Drag overlay should always be mounted and content within should be conditionally rendered
    return (
    <DragOverlay 
            dropAnimation={null}
            modifiers={modifiers}
            className='drag-overlay'
            >
            <div 
                className={DRAGGABLE_CONTAINER_CLASS}
                {...(context.position && {style: {transform: translate(context.position.x, context.position.y)}})}
            >
                { context.isDragging && dragged ? 
                    dragged 
                    : <div className='light-section round-corners padding loading'>
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
    const [draggingContent, setDraggingContent] = useState<ReactElement | null>(null);
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
            content: draggingContent, 
            setContent: setDraggingContent, 
            position: position,
            setPosition: setPosition, 
            isDragging
        }}
    >
        <DndContext 
            collisionDetection={closestCenter}
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
    droppable, 
    actionTitle,
    positioningProps,
    useHandle,
    dragStart,
    dragEnd,
    ...props
} : DraggableParams, ref) => {
    const id = useId();
    const dragContext = useContext(DraggableContext);
    
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

    const sharedDragStart = (e: DragStartEvent, callback?: (dragStartPosition: {x: number, y: number}) => void) => {
        handleDragStart(id, e, (props) => {
            // Set the starting coords of the drag and dragOverlay element to be where the item starts being dragged from
            const draggedContentElement = document.getElementById(id); 
            if (!!draggedContentElement) {
                const topLeftCornerOfElementBeforeDrag = numbersFromTranslate(draggedContentElement.style.transform);
                if (topLeftCornerOfElementBeforeDrag.x !== 0 || topLeftCornerOfElementBeforeDrag.y !== 0) {
                    // Set starting position of drag overlay to be where the real item is
                    dragContext.setPosition && dragContext.setPosition(topLeftCornerOfElementBeforeDrag);       
                    callback && callback(topLeftCornerOfElementBeforeDrag);
                }
            } 
            // Set drag overlay content to be that of the actual item
            dragContext.setContent && dragContext.setContent(draggedContent as ReactElement);
        })
    }

    const sharedDragEnd = (e: DragEndEvent, callback?: (dragEndPosition: {x: number, y: number}) => void) => {
        handleDragEnd(id, e, (props) => {
            // Move the actual HTML element (not overlay) to the ending position of the DragOverlay and make it visible
            if (e.active.rect.current.translated) {
                const translated = {x: e.active.rect.current.translated.left, y: e.active.rect.current.translated.top}
                dragContext.setPosition && dragContext.setPosition(null);
                callback && callback(translated);
            }
            dragContext.setContent && dragContext.setContent(null);
        })
    }

    return (
    droppable 
    ? <PickUpAndMove
        ref={ref}
        draggedContent={draggedContent}
        {...sharedPositioningProps}
        id={id}
        dragStart={sharedDragStart}
        dragEnd={sharedDragEnd}
    >
        {children}
    </PickUpAndMove>
    : 
    <FreelyDraggable 
        ref={ref}
        draggedContent={draggedContent}
        {...sharedPositioningProps}
        id={id}
        dragStart={sharedDragStart}
        dragEnd={sharedDragEnd}
    >
        {children}
    </FreelyDraggable> )
}));

// The subset of props required in both free drag and "pick up and move item" implementations
interface DragOptions {
    children: ReactNode,
    draggedContent: ReactNode,
    id: string,
    dragStart: DraggableParams["dragStart"],
    dragEnd: DraggableParams["dragEnd"],
    useDragHandle?: DraggableParams["useHandle"],
    itemType?: DraggableParams["itemType"],
    itemData?: DraggableParams["itemData"],
}

/**
 * Check if this element is the one being dragged, and if so, pass on any drag and drop data
 * @param id 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const handleDragEnd = (id: string, e: DragEndEvent, onDragEnd: (data: DragDropEventData) => void) => {
    const {active, over} = e;
    if (e.active.id !== id) {
        return;
    }
    const droppableData = over ? over.data.current : null;
    const draggedData = active.data.current;
    onDragEnd && onDragEnd({drag: draggedData as DragDropData, drop: droppableData as DragDropData});
}

/**
 * Check if this element is the one being dragged, and if so, execute the callback
 * @param id 
 * @param e 
 * @param onDragStart 
 * @returns 
 */
const handleDragStart = (id: string, e: DragStartEvent, onDragStart: (data: DragDropEventData) => void) => {
    const {active} = e;
    if (active.id !== id) {
        return;
    }
    const draggedData = active.data.current;
    onDragStart && onDragStart({drag: draggedData as DragDropData, drop: null});
}

/**
 * DND Kit implementation of a freely draggable element that stays where it is last moved to. 
 * @returns 
 */
const FreelyDraggable = observer(forwardRef(({
    children,
    draggedContent,
    id,
    itemType,
    itemData,
    dragStart, 
    dragEnd,
    ...props
}: DragOptions, forwardedRef): ReactNode => {
    const [startingCoords, setStartingCoords] = useState<null | {x: number, y: number}>(null);
    const [itemIsBeingDragged, setItemIsBeingDragged] = useState(false);
    
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        attributes: {
            role: "generic",
        },
        data: {
            type: itemType,
            value: itemData,  
        }
    });
    const ref = useMergeRefs([setNodeRef, forwardedRef]);
    /// Render the draggable item with drag start and end listeners, 
    // when drag starts use dragContext to set content for a dragOverlay rendered elsewhere. Hide the actual element. Set the dragged content to be the  
    // correct element and set a starting position as necessary. 
    // When drag ends, update the position of the actual element to be where the drag ended and unhide it. 

    useDndMonitor({
        onDragStart(e) {
            dragStart && dragStart(e, (startingPosition) => {
                setStartingCoords(startingPosition);
                setItemIsBeingDragged(true);
            })
        },
        onDragEnd(e) {
            dragEnd && dragEnd(e, (endingPosition) => {
                setStartingCoords(endingPosition);
                setItemIsBeingDragged(false);
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
    dragStart,
    dragEnd,
    itemType,
    itemData,
    draggedContent,
    ...passedElementProps
}: DragOptions, forwardedRef) => {
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        attributes: {
            role: "button",
        },
        data: {
            type: itemType,
            value: itemData,  
        }
    });
    const ref = useMergeRefs([forwardedRef, setNodeRef]);
    useDndMonitor({
        onDragStart: dragStart,
        onDragEnd: dragEnd,
    })
    ;

    return <div
        {...passedElementProps}
        ref={ref}
        id={id}
        {...attributes}
        {...listeners}
    >
        { children }
    </div>;
}));

//endregion Draggable
//region Droppable
/**
 * DND Kit implementation of a draggable element. 
 * @returns 
 */
export const DroppableDndKitImplementation = observer(forwardRef(({
    renderDroppableItem, 
    itemType, 
    itemData, 
    acceptedItemTypes, 
    onDrop, 
    ...props
}: DroppableParams, forwardedRef) => {
    const id = useId();
    const [validDropTarget, setValidDropTarget] = useState(false);
    const {setNodeRef, isOver} = useDroppable({
        id: id,
        data: {
            type: itemType,
            value: {
                ...itemData,
                accepts: acceptedItemTypes,
            }
        }
    });
    const ref = useMergeRefs([setNodeRef, forwardedRef])

    useDndMonitor({
        onDragOver(e) {
            const {active, over} = e;
            const droppableData = over ? over.data.current : null;
            const draggedData = active.data.current;
            setValidDropTarget(droppableData && draggedData && droppableData.value.accepts.includes(draggedData.type))
        },
        onDragEnd(e) {
            if (validDropTarget && onDrop) {
                const {active, over} = e;
                const droppableData = over ? over.data.current : null;
                const draggedData = active.data.current;
                droppableData && draggedData && onDrop({drag: draggedData as DragDropData, drop: droppableData as DragDropData});
            }
        }
    })

    return renderDroppableItem({
            ...props,
            id: id,
            className: combineClassNamePropAndString(`droppable${isOver ? (validDropTarget ? " valid" : " invalid") : ""}`, props),
        }, 
        ref
    );
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
                        // Stop searching for parent with DRAGGABLE_HANDLE_CLASS if they clicked on something else interactible
                        // that covered the drag handle
                        const interactableCoveringDragHandle = (
                            ["BUTTON", "INPUT", "TEXTAREA"].includes(node.tagName)
                            || node.classList.contains(INTERACTABLE_ELEMENT_CLASS)
                        ) && !(node.classList.contains(DRAGGABLE_HANDLE_CLASS));
                        const reachedParentDraggableNode = node.classList.contains(DRAGGABLE_CONTAINER_CLASS) && !node.classList.contains(DRAGGABLE_HANDLE_CLASS);
                        return interactableCoveringDragHandle || reachedParentDraggableNode;
                    }
                });
                return !!(event.isPrimary && thisOrParentElementIsDraggable);
            },
        },
    ];
  }

  //#endregionSensors