import {
    ClientRect,
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
} from 'react';
import { 
    DragDropData, 
    DRAGGABLE_CLASS, 
    DRAGGABLE_HANDLE_CLASS, 
    DraggableParams, 
    DroppableParams } from '@util/Draggable';
import { combineClassNamePropAndString } from '@util/constants';
import { clickedInBounds, searchThroughParents } from '@util/jsTools';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;


//#region Context
export const DraggableContext = createContext<{
    content: null | ReactNode, 
    setContent: Dispatch<SetStateAction<ReactNode>> | Dispatch<SetStateAction<null>>,
    isDragging: boolean,
}>({
    content: null, 
    setContent: () => {},
    isDragging: false,
});

/**
 * This is the content rendered on the drag preview layer/overlay. Drag overlay should always be mounted
 * @returns 
 */
export const DraggedContent = () => {
    const modifiers = [];
    modifiers.push(snapCenterToCursor);

    return <DragOverlay modifiers={modifiers}>
            { useContext(DraggableContext).content }
        </DragOverlay> 
}


export const WrapWithDndContext = observer(({
    children,
}: {
    children: ReactNode,
}) => {
    // Modifiers can be applied to drag overlay
    // Sensors can only be applied to dnd context
    const [contentBeingDragged, setContentBeingDragged] = useState<ReactNode | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const modifiers: Modifier[] = [];
    const sensorsToUse = [];
    const dragHandleSensor = useSensor(DragHandleSensor);
    const pointerSensor = useSensor(PointerSensor);
    
    sensorsToUse.push(pointerSensor);
    sensorsToUse.push(dragHandleSensor);
    
    const sensors = useSensors(...sensorsToUse);
    return <DraggableContext.Provider value={{content: contentBeingDragged, setContent: setContentBeingDragged, isDragging}}>
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
export const DraggableDndKitImplementation = observer(({ 
    droppable, 
    renderDraggableItem,
    ...props
} : DraggableParams) => {
    const id = useId();
    // TODO figure out how to use senors and monitors with context that's higher up. 
    // It needs to know to restrict to the drag handle?????
    // modifiers.push(restrictToView);
    const sharedClassNames = DRAGGABLE_CLASS;
    const renderWithClassNames = (props: ComponentPropsWithoutRef<any>, ref: ForwardedRef<any>) => renderDraggableItem({
        ...props,
        className: combineClassNamePropAndString(sharedClassNames, props),
    }, ref)
    return droppable 
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
    /> 
})

interface DragOptions {
    renderDraggableItem: DraggableParams["renderDraggableItem"],
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
        onDragEnd && onDragEnd({e, drag: draggedData as DragDropData, drop: droppableData as DragDropData});
    }
}

const handleDragStart = (id: string, e: DragStartEvent, onDragStart: DragOptions["onDragStart"]) => {
    const {active} = e;
    if (active.id === id) {
        const draggedData = active.data.current;
        onDragStart && onDragStart({e, drag: draggedData as DragDropData, drop: null});
    }
}

/**
 * DND Kit implementation of a freely draggable element.
 * @returns 
 */
const FreeDrag = observer(({
    renderDraggableItem,
    id,
    useDragHandle,
    actionTitle,
    itemType,
    itemData,
    onDragEnd, 
    onDragStart,
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
    
    return renderDraggableItem(
            {
                id: id,
                style: { 
                    transform: translate(goToPosition.x, goToPosition.y),
                },
                className: useDragHandle ? "" : DRAGGABLE_HANDLE_CLASS,
                ...listeners,
                ...attributes,
                "aria-label": actionTitle,
            },
            setNodeRef
        );
})

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndMove = observer(({
    id,
    renderDraggableItem,
    useDragHandle,
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
                dragContext.setContent(renderDraggableItem({}, null));
                onDragStart && onDragStart(...props);
            })
        },
        onDragEnd(e) {
            handleDragEnd(id, e, (...props) => {
                dragContext.setContent(null);
                onDragEnd && onDragEnd(...props)
            })
            
        }
    });
    
    return renderDraggableItem(
        {
            id: id,
            className: useDragHandle ? "" : " " + DRAGGABLE_HANDLE_CLASS,
            ...listeners,
            ...attributes,
            "aria-label": actionTitle,
        },
        setNodeRef,
    )
});

//endregion Draggable
//region Droppable
/**
 * DND Kit implementation of a draggable element. 
 * @returns 
 */
export const DroppableDndKitImplementation = forwardRef(({renderDroppableItem, itemType, acceptedItemTypes, onDrop, ...props}: DroppableParams, ref) => {
    const id = useId();
    const {setNodeRef, isOver} = useDroppable({
        id: id,
        data: {
            type: itemType,
            value: {
                accepts: acceptedItemTypes,
            }
        }
    });

    const setRefs = (instance: HTMLElement | null) => {
        setNodeRef(instance);
        if (typeof ref === "function") {
            ref(instance);
        }
        else if (ref) {
            ref.current = instance;
        }
    };

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
                droppableData && draggedData && onDrop({e, drag: draggedData as DragDropData, drop: droppableData as DragDropData});
            }
        }
    })

    return renderDroppableItem({
            ...props,
            id: id,
            className: combineClassNamePropAndString({className: `droppable${isOver ? (validDropTarget ? " valid" : " invalid") : ""}`, props}),
        }, setRefs);
})

//endregion Droppable
//#region Modifers
function restrictToDragHandleClass(args): Transform {
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

function restrictToView(args): Transform {
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
            eventName: 'onPointerDown' as any,
            handler: ({nativeEvent: event}: PointerEvent) => {
                // Iterate through parents until you find the one with DRAGGABLE_CLASS (top draggable parent)
                // and see if the user has clicked on the same spot as an element with DRAGGABLE_HANDLE_CLASS
                const thisOrParentElementIsDraggable = searchThroughParents({
                    start: event.target as HTMLElement,
                    successCondition: (node) => node.classList.contains(DRAGGABLE_HANDLE_CLASS) 
                        && clickedInBounds(node.getClientRects()[0], event.clientX, event.clientY),
                    failCondition: (node) => {
                        // Stop searching for parent with DRAGGABLE_HANDLE_CLASS if:  
                        // 1) there is a different button covering the drag handle
                        // 2) reaches DRAGGABLE_CLASS without a DRAGGABLE_HANDLE_CLASS
                        return (node.tagName === "BUTTON" && !(node.classList.contains(DRAGGABLE_HANDLE_CLASS)))
                            || (node.classList.contains(DRAGGABLE_CLASS) && !node.classList.contains(DRAGGABLE_HANDLE_CLASS));
                    }
                });
                return event.isPrimary && thisOrParentElementIsDraggable;
            },
        },
    ];
  }

//   class DragHandleTouchSensor extends TouchSensor {
//     static activators = [
//       {
//         eventName: 'onTouchStart' as any,
//         handler: ({nativeEvent: event}: TouchEvent) => {
//           if (
//             !event.isPrimary ||
//             event.button !== 0 ||
//             !clickedHandleClass(event.target, event.touches)
//           ) {
//             return false;
//           }
//           return true;
//         },
//       },
//     ];
//   }

  //#endregionSensors