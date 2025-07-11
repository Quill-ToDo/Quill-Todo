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
    DRAGGABLE_CONTAINER_CLASS, 
    DRAGGABLE_HANDLE_CLASS, 
    DraggableParams, 
    DroppableParams, 
    INTERACTABLE_ELEMENT_CLASS} from '@util/Draggable';
import { combineClassNamePropAndString } from '@util/jsTools';
import { assignForwardedRef, clickedInBounds, searchThroughParents } from '@util/jsTools';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { observer } from 'mobx-react-lite';
const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;


//#region Context
export const DraggableContext = createContext<{
    content: null | ReactElement, 
    setContent: null | Dispatch<SetStateAction<ReactElement | null>>,
    isDragging: boolean,
}>({
    content: null, 
    setContent: null,
    isDragging: false,
});

/**
 * This is the content rendered on the drag preview layer/overlay. It should alwqays be mounted
 * @returns 
 */
export const DraggingContent = observer(() => {
    const modifiers = [];
    modifiers.push(snapCenterToCursor);
    const dragged = useContext(DraggableContext); 

    // Drag overlay should always be mounted and content within should be conditionally rendered
    return <DragOverlay 
            dropAnimation={null}
            modifiers={modifiers}
            className='drag-overlay'
        >
            { dragged.content }
        </DragOverlay> 
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
    const [isDragging, setIsDragging] = useState(false);
    const modifiers: Modifier[] = [];
    const sensorsToUse = [];
    const dragHandleSensor = useSensor(DragHandleSensor, {
        activationConstraint: {
            distance: 10,
        }
    });
    const pointerSensor = useSensor(PointerSensor);
    
    sensorsToUse.push(pointerSensor);
    sensorsToUse.push(dragHandleSensor);
    
    const sensors = useSensors(...sensorsToUse);
    return <DraggableContext.Provider value={{
            content: draggingContent, 
            setContent: setDraggingContent, 
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
export const DraggableDndKitImplementation = observer(({ 
    droppable, 
    renderDraggableItem,
    ...props
} : DraggableParams) => {
    const id = useId();
    // Use a different draggable presentation if provided, otherwise default to the same presentation as the 
    // draggable item
    const renderWithClassNames = (p: ComponentPropsWithoutRef<any>, ref: ForwardedRef<any>) => renderDraggableItem({
        ...p,
        // TODO This is putting in a lot of draggable classes for some reason
        className: combineClassNamePropAndString(DRAGGABLE_CONTAINER_CLASS, p),
    }, ref);
    return (
    droppable 
    ? <PickUpAndMove 
        id={id}
        renderDraggableItem={renderWithClassNames}
        {...props}
    />
    : 
    <FreeDrag 
        id={id}
        renderDraggableItem={renderWithClassNames}
        {...props}
    /> )
})

// The subset of props required in both free drag and "pick up and move item" implementations
interface DragOptions {
    renderDraggableItem: DraggableParams["renderDraggableItem"],
    renderItemBeingDraggedIfDifferent?: DraggableParams["renderItemBeingDraggedIfDifferent"],
    id: string,
    onDragStart?: DraggableParams["onDragStart"],
    onDragEnd?: DraggableParams["onDragEnd"],
    useDragHandle?: DraggableParams["useHandle"],
    actionTitle: DraggableParams["actionTitle"],
    itemType?: DraggableParams["itemType"],
    itemData?: DraggableParams["itemData"],
}

const handleDragEnd = (id: string, e: DragEndEvent, onDragEnd: DragOptions["onDragEnd"]) => {
    const {active, over} = e;
    if (e.active.id === id) {
        const droppableData = over ? over.data.current : null;
        const draggedData = active.data.current;
        onDragEnd && onDragEnd({drag: draggedData as DragDropData, drop: droppableData as DragDropData});
    }
}

const handleDragStart = (id: string, e: DragStartEvent, onDragStart: DragOptions["onDragStart"]) => {
    const {active} = e;
    if (active.id === id) {
        const draggedData = active.data.current;
        onDragStart && onDragStart({drag: draggedData as DragDropData, drop: null});
    }
}

/**
 * DND Kit implementation of a freely draggable element that stays where it is last moved to
 * @returns 
 */
const FreeDrag = observer(({
    renderDraggableItem,
    id,
    actionTitle,
    itemType,
    itemData,
    onDragEnd, 
    onDragStart,
    ...props
}: DragOptions
) => {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: id,
        attributes: {
            role: "generic",
        },
        data: {
            type: itemType,
            value: itemData,  
        }
    });
    let goToPosition = {x: 0, y: 0};
    // TODO this might need to be set based on floating ui starting position
    const startingPosition: MutableRefObject<{x: number, y: number} | null> = useRef(null);
    useDndMonitor({
        onDragEnd(e) {
            handleDragEnd(id, e, (...props) => {
                startingPosition.current = {x: goToPosition.x, y: goToPosition.y};
                onDragEnd && onDragEnd(...props)
            })
        },
        onDragStart(e) {
            handleDragStart(id, e, onDragStart);
        }
    })
    if (startingPosition.current !== null) {
        goToPosition.x = startingPosition.current.x;
        goToPosition.y = startingPosition.current.y;
    }
    if (transform) {
        goToPosition.x += transform.x;
        goToPosition.y += transform.y;
    }
    const propsToRender = {
        id: id,
        style: { 
            transform: translate(goToPosition.x, goToPosition.y),
        },
        ...listeners,
        ...attributes,
        "aria-label": actionTitle,
    };
    return props.renderItemBeingDraggedIfDifferent ?
        props.renderItemBeingDraggedIfDifferent(propsToRender, setNodeRef)
        : renderDraggableItem(propsToRender, setNodeRef);
})

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndMove = observer(({
    id,
    renderDraggableItem,
    renderItemBeingDraggedIfDifferent,
    actionTitle,
    onDragStart,
    onDragEnd,
    itemType,
    itemData,
}: DragOptions) => {
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
    const dragContext = useContext(DraggableContext);
    
    useDndMonitor({
        onDragStart(e) {
            handleDragStart(id, e, (...props) => {
                const draggedContent = renderItemBeingDraggedIfDifferent ? 
                    renderItemBeingDraggedIfDifferent(props, null)
                    : renderDraggableItem(props, null);
                dragContext.setContent && dragContext.setContent(draggedContent as ReactElement);
                onDragStart && onDragStart(...props);
            })
        },
        onDragEnd(e) {
            handleDragEnd(id, e, (...props) => {
                dragContext.setContent && dragContext.setContent(null);
                onDragEnd && onDragEnd(...props)
            })
            
        }
    });
    const props = {
        id: id,
        ...listeners,
        ...attributes,
        "aria-label": actionTitle,
    };
    return renderItemBeingDraggedIfDifferent ? 
        renderItemBeingDraggedIfDifferent(props, setNodeRef)
        : renderDraggableItem(props, setNodeRef)
});

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
}: DroppableParams, ref) => {
    const id = useId();
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
    const [validDropTarget, setValidDropTarget] = useState(false);

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
        (node: HTMLElement | null) => {
            setNodeRef(node);
            assignForwardedRef(ref, node);
        });
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
                const thisOrParentElementIsDraggable = searchThroughParents({
                    start: event.target as HTMLElement,
                    successCondition: (node) => node.classList.contains(DRAGGABLE_HANDLE_CLASS) 
                        && clickedInBounds(node.getClientRects()[0], event.clientX, event.clientY),
                    failCondition: (node) => {
                        // Stop searching for parent with DRAGGABLE_HANDLE_CLASS if
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