import {
    ClientRect,
    DndContext, 
    DragOverlay,  
    Modifier,  
    PointerSensor,    
    SensorDescriptor,  
    TouchSensor,  
    useDndContext,  
    useDndMonitor,  
    useDraggable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {Transform} from '@dnd-kit/utilities';
import { MutableRefObject, ReactNode, useId, useRef, useState } from 'react';
import { DRAGGABLE_HANDLE_CLASS, DraggableParams } from '@util/Draggable';
const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

interface DragOptions {
    children: ReactNode,
    useDragHandle?: boolean,
}

/**
 * DND Kit implementation of a freely draggable element.
 * @returns 
 */
const FreeDrag =  ({
    useDragHandle,
    children,
}: DragOptions
) => {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: useId(),
    });
    let goToPosition = {x: 0, y: 0};
    const startingPosition: MutableRefObject<{x: number, y: number} | null> = useRef(null);
    useDndMonitor({
        onDragEnd() {
            startingPosition.current = {x: goToPosition.x, y: goToPosition.y};
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
    
    return <div
        ref={setNodeRef} 
        style={{transform: translate(goToPosition.x, goToPosition.y )}}
        className={useDragHandle ? DRAGGABLE_HANDLE_CLASS : undefined}
        {...listeners}
        {...attributes}
    >
        { children }
    </div>;
}

/**
 * DND Kit implementation of a an element that can be picked up and dropped into another container
 * @returns 
 */
const PickUpAndMove = ({
    children,
    useDragHandle,
}: DragOptions) => {
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: useId(),
    });
    
    const [isDragging, setIsDragging] = useState(false);

    useDndMonitor({
        onDragStart() {
            setIsDragging(true);
        },
        onDragEnd() {
            setIsDragging(false);
        }
    });
    
    return <>
        <div
            ref={setNodeRef} 
            className={useDragHandle ? DRAGGABLE_HANDLE_CLASS : undefined}
            {...listeners}
            {...attributes}
        >
            { children }
        </div>
        {/* This is the content rendered on the drag preview layer/overlay. Drag overlay should
        always be mounted */}
        <DragOverlay>
            { isDragging 
                ? children
                : null
            }
        </DragOverlay> 
    </>
}

/**
 * DND Kit implementation of a draggable element. If useHandle=true, some element within the draggable content should have the class
 * DRAGGABLE_HANDLE_CLASS
 * @returns 
 */
export const DraggableDndKitImplementation = ({ 
    droppable, 
    children,
    useHandle,
} : DraggableParams) => {
    const modifiers: Modifier[] = [];
    const dragHandleSensor = useSensor(UseDragHandleSensor);
    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 10,
        }
    });
    const sensorsToUse = [];
    if (useHandle) {
        sensorsToUse.push(dragHandleSensor);
    } else {
        sensorsToUse.push(pointerSensor);
    }
    const sensors = useSensors(...sensorsToUse);
    // modifiers.push(restrictToView);
    return <WrapWithContext
        modifiers={modifiers}
        sensors={sensors}
    >
        {
            droppable 
            ? <PickUpAndMove 
                useDragHandle={useHandle}
                >
                { children }
            </PickUpAndMove> 
            : <FreeDrag 
                useDragHandle={useHandle}
                > 
                { children }
            </FreeDrag>
        }
    </WrapWithContext>
}

const WrapWithContext = ({
    children,
    modifiers,
    sensors,
}: {
    children: ReactNode,
    modifiers?: Modifier[],
    sensors?: SensorDescriptor<any>[]
}) => {
    const parentContext = useDndContext().active;
    if (parentContext) {
        return children;
    } else {
        return <DndContext 
            modifiers={modifiers}
            sensors={sensors}
            autoScroll={false}
        >
            { children }
        </DndContext>;
    }
}
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
  
    // OOF on left
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
  //#startregion Sensors
  class UseDragHandleSensor extends PointerSensor {
    static activators = [
      {
        eventName: 'onPointerDown' as any,
        handler: ({nativeEvent: event}: PointerEvent) => {
          if (
            !event.isPrimary ||
            event.button !== 0 ||
            !hasHandleClass(event.target)
          ) {
            return false;
          }
          return true;
        },
      },
    ];
  }

  class UseDragHandleTouchSensor extends TouchSensor {
    static activators = [
      {
        eventName: 'onPointerDown' as any,
        handler: ({nativeEvent: event}: PointerEvent) => {
          if (
            !event.isPrimary ||
            event.button !== 0 ||
            !hasHandleClass(event.target)
          ) {
            return false;
          }
          return true;
        },
      },
    ];
  }

  const hasHandleClass = (target: HTMLElement) => {
    return target.classList.contains(DRAGGABLE_HANDLE_CLASS);
  }
  //#endregionSensors