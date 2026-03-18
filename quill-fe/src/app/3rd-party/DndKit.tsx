import {
    DragOverlay,  
    useDragDropMonitor,
    PointerSensor,    
    useDraggable,
    useDroppable,
    KeyboardSensor,
    DragDropProvider,
    DragDropManager,
} from '@dnd-kit/react';
import {
    RestrictToElement,
    RestrictToWindow,
} from '@dnd-kit/dom/modifiers';
import { 
    Modifier, 
    DragOperation,
 } from '@dnd-kit/abstract';
// TODO use internal merge ref method, bad that im using external library here
import { useMergeRefs } from '@floating-ui/react';
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
    ForwardedRef,
    MutableRefObject,
    ForwardRefRenderFunction,
} from 'react';
import { 
    FormattedDragDropEventData, 
    DraggableParams, 
    DroppableParams,
    DndKitDragOperation,
    DraggableRenderMethodParams, } from '@/app/util/Draggable';
import { combineClassNamePropAndString} from '@/app/util/jsTools';
import { observer } from 'mobx-react-lite';
import { 
    DRAGGABLE_CONTAINER_CLASS, 
    DRAGGABLE_HANDLE_CLASS, 
    DRAG_POSITIONER_CLASS,
    HIDDEN_CLASS,
} from '../util/constants';
import { RequiredDragData, RequiredDropData } from '../util/DraggableTypes';

import { Coordinates } from '@dnd-kit/core/dist/types';
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

// The subset of props required in both free drag and "pick up and move item" implementations
type DragOptions<DragData extends RequiredDragData> = {
    dragStartFreeAndDroppable: (props: ParamsNeededForDragOrDropCallback) => void,
    dragEndFreeAndDroppable: (props: ParamsNeededForDragOrDropCallback) => void,
    itemData: DragData,
    useDragHandle?: boolean,
    componentProps: ComponentPropsWithoutRef<any>,
};

type DragOptionsRender<DragData extends RequiredDragData> = 
	DragOptions<DragData> & DraggableRenderMethodParams<DragData>;

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
type DraggableContext = {
    renderDragOverlay: ForwardRefRenderFunction<any, any>, 
    setRenderDragOverlay: Dispatch<SetStateAction<ForwardRefRenderFunction<any, any>>>,
    draggedOverValidTarget: boolean,
    setDraggedOverValidTarget: Dispatch<SetStateAction<boolean>>,
    overlayPosition: null | {x: number, y: number},
    setOverlayPosition: null | Dispatch<SetStateAction<{x: number, y: number} | null>>, 
    isDragging: boolean,
    startDragFromCursor: boolean,
    setStartDragFromCursor: Dispatch<SetStateAction<boolean>>,
}
export const DraggableContext = createContext<DraggableContext>({
    draggedOverValidTarget: false,
    setDraggedOverValidTarget: () => null,
    renderDragOverlay: (props, ref) => null, 
    setRenderDragOverlay: () => null,
    overlayPosition: null,
    setOverlayPosition: null,
    isDragging: false,
    startDragFromCursor: false,
    setStartDragFromCursor: () => null,
});

/**
 * This is the content rendered on the drag preview layer/overlay. It should always be mounted
 * @returns 
 */
export const DraggingContent = observer(() => {
    const { 
        renderDragOverlay, 
        overlayPosition,
        startDragFromCursor,
    } = useContext(DraggableContext); 
    // Use content from nearest drag context to render dragged content in a positioned drag overlay
    // Drag overlay should always be mounted and content within should be conditionally rendered
    const modifiers = []
    if (startDragFromCursor) {
        modifiers.push(SnapCenterToCursor);
    }
    return (
        <DragOverlay 
            // disabled={!renderDragOverlay}
            // dropAnimation={() => {}}
            // className='drag-overlay'
            // modifiers={modifiers}
            className={`drag-overlay ${DRAGGABLE_CONTAINER_CLASS}`}
            >
                {renderDragOverlay && renderDragOverlay((overlayPosition && {style: {transform: translate(overlayPosition.x, overlayPosition.y)}}), null)}                    

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
    const [renderDragOverlay, setRenderDragOverlay] = useState<ForwardRefRenderFunction<any, any>>(() => (props, ref) => <h1 
            ref={ref} 
            {...props}>
                default overlay
            </h1>
    );
    const [draggedOverValidTarget, setDraggedOverValidTarget] = useState<boolean>(false);
    const [overlayPosition, setOverlayPosition] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startDragFromCursor, setStartDragFromCursor] = useState(false);
    const sensorsToUse = [PointerSensor.configure({
        // activationConstraints: {
        //     distance: {value: 10},
        // }
    }), KeyboardSensor];
        
    return (
    <DragDropProvider
            // plugins={[Debug]}
            sensors={sensorsToUse}
            onDragStart={(e) => {
                setIsDragging(true);
            }}
            onDragEnd={(e) => {
                setIsDragging(false);
            }}
        >
                <DraggableContext.Provider value={{
                    renderDragOverlay, 
                    setRenderDragOverlay, 
                    overlayPosition,
                    setOverlayPosition, 
                    isDragging,
                    draggedOverValidTarget,
                    setDraggedOverValidTarget,
                    startDragFromCursor,
                    setStartDragFromCursor
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
    droppable, 
    actionTitle,
    useHandle,
    dragStart,
    dragEnd,
    itemData, 
    componentProps
} : DraggableParams<any> & Pick<DragOptions<any>, "componentProps">, ref) => {
    const id = useId();
    const { setRenderDragOverlay } = useContext(DraggableContext);
    
    // Add positioner class and popup handle class to entire element if not specified to use a handle
    const sharedPositioningProps = {
        ...componentProps,
        className: combineClassNamePropAndString(`${DRAG_POSITIONER_CLASS}${useHandle?"":" " + DRAGGABLE_HANDLE_CLASS}`, componentProps),
        id: id,
        "aria-label": actionTitle,
    };
    // Use a different draggable presentation if provided, otherwise default to the same presentation as the 
    // draggable item
    const draggedContent = draggedPresentation ?
       draggedPresentation
        : children;

    const sharedDragStart: DragOptions<any>["dragStartFreeAndDroppable"] = (props) => {
        continueIfThisElementDragging({...props, thenIfValid: (data) => {
            // Set drag overlay content to be that of the actual item
            setRenderDragOverlay && setRenderDragOverlay((prevRender: DraggableContext["renderDragOverlay"]) => draggedContent);
            dragStart && dragStart(data);
            props.thenIfValid && props.thenIfValid(data);
        }})
    }

    const sharedDragEnd: DragOptions<any>["dragEndFreeAndDroppable"] = (props) => {
        continueIfThisElementDragging({...props, thenIfValid: (data) => {
            setRenderDragOverlay && setRenderDragOverlay((prevRender: DraggableContext["renderDragOverlay"]) => null);
            dragEnd && dragEnd(data);
            props.thenIfValid && props.thenIfValid(data);
        }})
    }

    return (
        droppable 
            ? <PickUpAndDropInContainer
                componentProps={sharedPositioningProps}
                ref={ref}
                dragStartFreeAndDroppable={sharedDragStart}
                dragEndFreeAndDroppable={sharedDragEnd}
                itemData={itemData}
                useDragHandle={useHandle}
                >
                {children}
            </PickUpAndDropInContainer>
            : 
            <FreelyDraggable 
                componentProps={sharedPositioningProps}
                ref={ref}
                dragStartFreeAndDroppable={sharedDragStart}
                dragEndFreeAndDroppable={sharedDragEnd}
                itemData={itemData}
            >
                {children}
            </FreelyDraggable> )
}));

export const DraggableDndKitRenderMethodImplementation = observer(forwardRef<any, DraggableRenderMethodParams<any> & Pick<DragOptions<any>, "componentProps">>(({ 
    dragStart,
    dragEnd,
    droppable,
	draggedPresentation,
    itemData,
    actionTitle,
    useHandle,
    render,
    id,
    componentProps
}, ref) => {
    const { setRenderDragOverlay } = useContext(DraggableContext);
    const idToUse = id ? id : useId();

    const freeAndDroppableDragStart: DragOptions<any>["dragStartFreeAndDroppable"] = ({thenIfValid, targetElementId, operation, event}) => {
        // Set drag overlay based on the originating element
        continueIfThisElementDragging({targetElementId, operation, thenIfValid: (data) => {
            // If there is a different dragged presentation, start drag position from cursor, not original element, so there's not a gap where the mouse starts dragging
            // Use a different draggable presentation if provided, otherwise default to the same presentation as the 
            // draggable item
            const draggedContent: ForwardRefRenderFunction<any, any> = !!draggedPresentation ? (props, ref) => draggedPresentation({
                ...props,
            }, ref) 
                : (props, ref) => render({
                    ...props,
                    ...componentProps,
                }, ref);
            setRenderDragOverlay && setRenderDragOverlay((prev: DraggableContext["renderDragOverlay"]) => draggedContent);
            // Callback specific to freely draggable or drag and drop
            thenIfValid && thenIfValid(data);
            // Callback from popup component
            dragStart && dragStart(data);
        }})
    }

    // shouldnt i be able to do these in either order, 
    const freeAndDroppableDragEnd: DragOptions<any>["dragEndFreeAndDroppable"] = ({thenIfValid, ...props}) => {
        continueIfThisElementDragging({...props, thenIfValid: (data) => {
            // Callback specific to freely draggable or drag and drop
            thenIfValid && thenIfValid(data);
            // Callback from popup component
            dragEnd && dragEnd(data);
        }})
    }
    
    // Add positioner class and popup handle class to entire element if not specified to use a handle
    const sharedProps: ComponentPropsWithoutRef<any> = {
        ...componentProps,
        className: combineClassNamePropAndString(`${DRAG_POSITIONER_CLASS}`, componentProps),
        id: idToUse,
        // "aria-label": actionTitle,
    };

    return (
        droppable 
            ? <PickUpAndDropInContainerRenderMethod
                ref={ref}
                componentProps={sharedProps}
                sharedDragStart={freeAndDroppableDragStart}
                sharedDragEnd={freeAndDroppableDragEnd}
                itemData={itemData}
                render={render}
                draggedPresentation={draggedPresentation}
            />
            : 
            <FreelyDraggableRenderMethod 
                ref={ref}
                componentProps={sharedProps}
                dragStartFreeAndDroppable={freeAndDroppableDragStart}
                dragEndFreeAndDroppable={freeAndDroppableDragEnd}
                itemData={itemData}
                render={render}
                draggedPresentation={draggedPresentation}
            />)
}));

/**
 * DND Kit implementation of a freely draggable element that stays where it is last moved to. 
 * @returns 
 */
const FreelyDraggable = observer(forwardRef<any, DragOptions<any> & {children: ReactNode}>(({
    children,
    itemData,
    dragStartFreeAndDroppable, 
    dragEndFreeAndDroppable,
    useDragHandle,
    componentProps,
}, forwardedRef): ReactNode => {
    const { setOverlayPosition } = useContext(DraggableContext);
    const [startingCoords, setStartingCoords] = useState<null | {x: number, y: number}>(null);
    const [itemIsBeingDragged, setItemIsBeingDragged] = useState(false);

    const id = componentProps.id ? componentProps.id : useId();

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
            dragStartFreeAndDroppable({targetElementId: id, operation: e.operation, event: e.nativeEvent, thenIfValid: ({drag}: FormattedDragDropEventData<any, any>) => {
                setItemIsBeingDragged(true);
                // TODO might be able to update this to use new dnd kit options and not query the document
                // Set the starting coords of the drag and dragOverlay element to be where the item starts being dragged from
                const draggedContentElement = document.getElementById(id); 
                if (!!draggedContentElement) {
                    const topLeftCornerOfElementBeforeDrag = numbersFromTranslate(draggedContentElement.style.transform);
                    if (topLeftCornerOfElementBeforeDrag.x !== 0 || topLeftCornerOfElementBeforeDrag.y !== 0) {
                        setOverlayPosition && setOverlayPosition(topLeftCornerOfElementBeforeDrag);       
                        setStartingCoords(topLeftCornerOfElementBeforeDrag);
                    }
                }
            }});
        },
        onDragEnd(e, manager) {
            dragEndFreeAndDroppable({targetElementId: id, operation: e.operation, event: e.nativeEvent, thenIfValid: ({drag}: FormattedDragDropEventData<any, any>) => {
                setItemIsBeingDragged(false);
                const final = e.operation;
                // Move the actual HTML element (not overlay) to the ending position of the DragOverlay and make it visible
                const transform = final.transform; 
                if (transform) {
                    setOverlayPosition && setOverlayPosition(null);
                    setStartingCoords({
                        x: (startingCoords? startingCoords.x : 0) + transform.x, 
                        y: (startingCoords ? startingCoords.y : 0) + transform.y 
                    });
                }
            }})
        },
    })

    // Hide the actual item when the drag overlay is not rendered
    return itemIsBeingDragged ? null : <div
            id={id}
            ref={merged}
            {...componentProps}
            {
                // Set the position of the actual element not while dragging
                ...(startingCoords && {style: {transform: translate(startingCoords.x, startingCoords.y)}})
            }
            >
        {children}
    </div>;
}));

const FreelyDraggableRenderMethod = observer(forwardRef<any, DragOptionsRender<any>>(({
        render, 
        useDragHandle,
        dragStartFreeAndDroppable,
        dragEndFreeAndDroppable,
        itemData,
        componentProps,
    }, ref) => {
    const {ref: draggingRef} = useDraggable({
        id: componentProps.id,
        data: itemData,
    });
    const [thisElementDragging, setThisElementDragging] = useState(false)
    const { setRenderDragOverlay } = useContext(DraggableContext);
    const [dragEndCoords, setDragEndCoords] = useState<{x: number, y: number}>();
    const merged = useMergeRefs([ref, draggingRef]);

	useDragDropMonitor({
        onDragStart: (e, manager) => {
            dragStartFreeAndDroppable({targetElementId: componentProps.id, operation: e.operation, thenIfValid: ({drag, drop}) => {
                setThisElementDragging(true);
                if (dragEndCoords) {
                    // If the element has been dragged, set the overlay to this position as well.
                    // (dragStartFreeAndDroppable currently resets the drag overlay to 
                    // initial position of the element passed in with componentProps so need to update that to be the dragged location)
                    setRenderDragOverlay && setRenderDragOverlay((prev: DraggableContext["renderDragOverlay"]) => (props, ref) => render({
                        ...props,
                        ...componentProps,
                        style: {transform: translate(dragEndCoords.x, dragEndCoords.y)},
                    }, ref));
                    return;
                }
                const elementStartingPosition = (componentProps.style && componentProps.style.transform ? componentProps.style.transform : null);
                const {x, y} = numbersFromTranslate(elementStartingPosition);
                // If the element is translated to start with, mark it as the starting coordinates
                if (elementStartingPosition && x !== 0 || y !== 0) {
                    setDragEndCoords({x, y});
                }
            }});
        },
        onDragEnd: (e, manager) => {
            // Move the actual HTML element (not overlay) to the ending position of the overlay
            dragEndFreeAndDroppable({operation: e.operation, targetElementId: componentProps.id, thenIfValid: ({drag}) => {
                setThisElementDragging(false);
                const final = e.operation;
                const transform = final.transform; 
                if (transform) {
                    setDragEndCoords((prev) => {
                        return {
                            x: (prev ? prev.x : 0) + transform.x, 
                            y: (prev ? prev.y : 0) + transform.y 
                    }});
                }
            }});
        },
        // onDragOver: (e, manager) => {
        //     continueIfThisElementDragging({targetElementId: id, operation: e.operation, callbackIfValid: ({drop}) => {
        //         if (itemData && drop && drop.accepts && setDraggedOverValidTarget) {
        //             setDraggedOverValidTarget(drop.accepts.includes(itemData.type));
        //         }
        //     }});
        // }
    });

    // Render the actual element in place (not the drag overlay)
    return render({
        ...componentProps,
        // Hide the actual element when the drag overlay is not rendered
        ...(thisElementDragging ? {className: combineClassNamePropAndString(HIDDEN_CLASS, componentProps)} : {}),
        id: componentProps.id,
        // If this element was dragged, render it at the position it was dragged to
        ...(dragEndCoords ? {style: {transform: translate(dragEndCoords.x, dragEndCoords.y)}} : null)
    }, merged);
}));

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndDropInContainer = observer(forwardRef(({
    children,
    dragStartFreeAndDroppable,
    dragEndFreeAndDroppable,
    itemData,
    useDragHandle,
    componentProps,
}: DragOptions<any> & {children: ReactNode}, forwardedRef: ForwardedRef<any>) => {
    const { setDraggedOverValidTarget } = useContext(DraggableContext);
    const { ref } = useDraggable({
        id: componentProps.id,
        data: itemData,  
    });
    const merged = useMergeRefs([forwardedRef, ref])

    useDragDropMonitor({
        onDragStart: (e, manager) => {
            dragStartFreeAndDroppable({operation: e.operation, targetElementId: componentProps.id, thenIfValid: () => {}});
        },
        onDragEnd: (e, manager) => {
            dragEndFreeAndDroppable({operation: e.operation, targetElementId: componentProps.id, thenIfValid: () => {}});
        },
        onDragOver: (e, manager) => {
            continueIfThisElementDragging({targetElementId: componentProps.id, operation: e.operation, thenIfValid: ({drop}) => {
                if (itemData && drop && drop.accepts && setDraggedOverValidTarget) {
                    setDraggedOverValidTarget(drop.accepts.includes(itemData.type));
                }
            }});
        }
    });

    return <div
        {...componentProps}
        ref={merged}
    >
        { children }
    </div>;
}));

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndDropInContainerRenderMethod = observer(forwardRef<any, DraggableRenderMethodParams<any>>(({
    render,
    sharedDragStart,
    sharedDragEnd,
    itemData,
    useDragHandle,
    displayName,
    propTypes,
    defaultProps,
    draggedPresentation,
    componentProps,
}, ref) => {
    const { setStartDragFromCursor, startDragFromCursor } = useContext(DraggableContext);
    const modifiers = []
    if (draggedPresentation) {
        // Dragged presentation might have different width than source element, so start
        // drag from cursor position, not position of source element, to avoid gaps between dragged 
        // element and pointer
        modifiers.push(SnapCenterToCursor);
    }
    modifiers.push(RestrictToWindow)
    const { ref: draggingRef } = useDraggable({
        id: componentProps.id,
        data: itemData,  
        modifiers,
    });
    const merged = useMergeRefs([ref, draggingRef]);

    useDragDropMonitor({
        onDragStart: (e, manager) => {
            sharedDragStart({operation: e.operation, targetElementId: componentProps.id, event: e.nativeEvent});
                // setStartDragFromCursor(true);
        },
        onDragEnd: (e, manager) => {
            sharedDragEnd({operation: e.operation, targetElementId: componentProps.id, event: e.nativeEvent});
                // setStartDragFromCursor(false);
        },
        // onDragOver: (e, manager) => {
        //     continueIfThisElementDragging({targetElementId: id, operation: e.operation, callbackIfValid: ({drop}) => {
        //         if (itemData && drop && drop.accepts && setDraggedOverValidTarget) {
        //             setDraggedOverValidTarget(drop.accepts.includes(itemData.type));
        //         }
        //     }});
        // }
    });

    // Render the item in its drag start position (not drag overlay)
    return render({
        ...componentProps,
    }, merged);
}));


type ParamsNeededForDragOrDropCallback = {
    targetElementId: string, 
    operation: DndKitDragOperation, 
    thenIfValid: (data: FormattedDragDropEventData<RequiredDragData, RequiredDropData>) => void,
    event?: PointerEvent,
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
const continueIfThisElementDragging = <DragData extends RequiredDragData, DropData extends RequiredDropData>({operation, targetElementId, thenIfValid}: ParamsNeededForDragOrDropCallback) => {
    if (operation) {
        const droppable = operation.target;
        const dragged = operation.source;
        if (!dragged || dragged.id !== targetElementId) {
            return;
        }
        const data: FormattedDragDropEventData<DragData, DropData> = {e: {isDragging: !!(dragged && dragged.isDragging)}, drag: dragged.data, drop: droppable ? droppable.data : null}; 
        thenIfValid && thenIfValid(data);
    }
}

/**
 * Check if this element is the one with something dropping on it, and if so, pass on any drag and drop data
 * @param draggedElementId 
 * @param e 
 * @param onDragEnd 
 * @returns 
 */
const continueIfThisElementDroppedOnto = ({operation, targetElementId, thenIfValid} : ParamsNeededForDragOrDropCallback) => {
    if (operation) {
        const droppable = operation.target;
        const dragged = operation.source;
        if (!droppable || droppable.id !== targetElementId) {
            // This is not the same element that called this method
            return;
        }
        const data: FormattedDragDropEventData<RequiredDragData, RequiredDropData> = {drag: dragged ? dragged.data : null, drop: droppable.data, e: { isDragging: !!(dragged && dragged.isDragging)}}; 
        thenIfValid && thenIfValid(data);
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
    const {ref, isDropTarget, droppable} = useDroppable({
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
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, event: e, thenIfValid: ({drag, drop, e}: FormattedDragDropEventData<RequiredDragData, RequiredDropData>) => {
                if (drop && drag && drop.accepts.includes(drag.type)) {
                    setValidDropTarget(true)
                    const callbacks = callbacksForAcceptedDragTypes[drag.type];
                    callbacks.dragOver && callbacks.dragOver({drag, drop, e});
                    drag.showDropPreview && callbacks.setDataWhenDragOver && callbacks.setDataWhenDragOver({drag, drop, e});
                } else {
                    setValidDropTarget(false);
                }
            }})
        },
        onDragEnd(e, manager) {
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, thenIfValid: ({drag, drop, e}) => {
                // Dropped on this droppable spot
                if (validDropTarget && drag) {
                    const callbacks = callbacksForAcceptedDragTypes[drag.type];
                    callbacks && callbacks.dragEnd && callbacks.dragEnd({drag, drop, e});
                    callbacks.saveDataWhenDragEnds && callbacks.saveDataWhenDragEnds({drag, drop, e});
                    return;
                } 
            }})
            // TODO: If cancelled
            if (e.operation.source && acceptedItemTypes.includes(e.operation.source.data.type) ) {
                const drag = e.operation.source.data as RequiredDragData & any;
                const drop = undefined;
                const callbacks = callbacksForAcceptedDragTypes[drag.type];
                if (e.canceled ) {
                    callbacks && callbacks.dragCancel && callbacks.dragCancel({drag, drop, e: {...e, isDragging: e.operation.status.dragging}});
                }
                callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag, drop, e: {...e, isDragging: e.operation.status.dragging}});
            }
        },
        onDragMove(e, manager) {
            // Something was dragged
            const drag = e.operation.source; 
            const drop = e.operation.target; 
            if (drag && validDropTarget && !droppable.isDropTarget) {
                setValidDropTarget(false);
                const callbacks = callbacksForAcceptedDragTypes[drag.data.type];
                if (callbacks) {
                    callbacks.dragMove && callbacks.dragMove({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
                    // Todo figure out if this element was dragged off?
                    // drag.data.showDropPreview && callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
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
        className={combineClassNamePropAndString(`droppable${droppable.isDropTarget ? (validDropTarget ? " dropping valid" : " dropping invalid") : ""}`, props)}
    >
        {children}
    </div> 
}));

export const DroppableDndKitRenderMethodImplementation = observer(forwardRef<any, DraggableRenderMethodParams<any>>(({
    itemData, 
    callbacksForAcceptedDragTypes, 
    collisionPriority,
    render,
    ...props
},
 forwardedRef) => {
    const id = props.id ? props.id : useId();
    const [validDropTarget, setValidDropTarget] = useState(false);
    const acceptedItemTypes = Object.keys(callbacksForAcceptedDragTypes);
    const {ref, isDropTarget, droppable} = useDroppable({
        element: forwardedRef as MutableRefObject<any>,
        collisionPriority: collisionPriority, 
        id: id,
        data: {
            ...itemData,
            accepts: acceptedItemTypes,
        }
    });
    const merged = useMergeRefs([forwardedRef, ref])

    useDragDropMonitor({
        onDragOver(e, manager) {
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, thenIfValid: ({drag, drop, e}: FormattedDragDropEventData<RequiredDragData, RequiredDropData>) => {
                if (drop && drag && drop.accepts.includes(drag.type)) {
                    setValidDropTarget(true)
                    const callbacks = callbacksForAcceptedDragTypes[drag.type];
                    callbacks.dragOver && callbacks.dragOver({drag, drop, e});
                    drag.showDropPreview && callbacks.setDataWhenDragOver && callbacks.setDataWhenDragOver({drag, drop, e});
                } else {
                    setValidDropTarget(false);
                }
            }})
        },
        onDragEnd(e, manager) {
            continueIfThisElementDroppedOnto({targetElementId: id, operation: e.operation, thenIfValid: ({drag, drop, e}) => {
                // Dropped on this droppable spot
                if (validDropTarget && drag) {
                    const callbacks = callbacksForAcceptedDragTypes[drag.type];
                    callbacks && callbacks.dragEnd && callbacks.dragEnd({drag, drop, e});
                    callbacks.saveDataWhenDragEnds && callbacks.saveDataWhenDragEnds({drag, drop, e});
                    return;
                } 
            }})
            // TODO: If cancelled
            if (e.operation.source && acceptedItemTypes.includes(e.operation.source.data.type) ) {
                const drag = e.operation.source.data as RequiredDragData & any;
                const drop = undefined;
                const callbacks = callbacksForAcceptedDragTypes[drag.type];
                if (e.canceled ) {
                    callbacks && callbacks.dragCancel && callbacks.dragCancel({drag, drop, e: {...e, isDragging: e.operation.status.dragging}});
                }
                callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag, drop, e: {...e, isDragging: e.operation.status.dragging}});
            }
        },
        onDragMove(e, manager) {
            // Something was dragged
            const drag = e.operation.source; 
            const drop = e.operation.target; 
            if (drag && validDropTarget && !droppable.isDropTarget) {
                setValidDropTarget(false);
                const callbacks = callbacksForAcceptedDragTypes[drag.data.type];
                if (callbacks) {
                    callbacks.dragMove && callbacks.dragMove({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
                    // Todo figure out if this element was dragged off?
                    // drag.data.showDropPreview && callbacks.resetDataWhenDragOff && callbacks.resetDataWhenDragOff({drag: drag.data as RequiredDragData, drop: drop ? drop.data : null, e: {isDragging: drag.isDragging}});
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

    return render({
        id: id,
        ...props,
        className: combineClassNamePropAndString(`droppable${droppable.isDropTarget ? (validDropTarget ? " dropping valid" : " dropping invalid") : ""}`, props),
    }, merged); 
}));

//endregion Droppable
//#region Modifers
class SnapCenterToCursor extends Modifier {
    constructor(manager: DragDropManager) {
        super(manager);
    };

    public apply({transform, activatorEvent, shape}: DragOperation): Coordinates {
        if (activatorEvent && shape) {
            const activatorCoordinates = {
                x: (activatorEvent as PointerEvent).x, 
                y: (activatorEvent as PointerEvent).y
            };

            const pointerOffsetFromLeftOfTarget = activatorCoordinates.x - shape.initial.boundingRectangle.left;
            const pointerOffsetFromTopOfTarget = activatorCoordinates.y - shape.initial.boundingRectangle.top;

            return {
                ...transform,
                x: transform.x + pointerOffsetFromLeftOfTarget,
                y: transform.y + pointerOffsetFromTopOfTarget,
            };
        }

        return transform;
    };
};

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
/**
 * Activates when the user clicks on an element with DRAGGABLE_HANDLE_CLASS or a parent element with DRAGGABLE_HANDLE_CLASS
 */
// class DragHandleSensor extends PointerSensor {
//     static activators = [
//         {
//             eventName: "onPointerDown" as const,
//             handler: (props) => {
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