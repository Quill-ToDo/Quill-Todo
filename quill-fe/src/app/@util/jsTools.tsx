import { ClientRect } from "@dnd-kit/core";
import { ComponentPropsWithoutRef, ForwardedRef, RefCallback } from "react";

export const iterateThroughParents = ({
    start,
    callback,
    limit=20,
}: {
    start: HTMLElement | null,
    callback: (parent: HTMLElement) => any
    limit?: number,
}) => {
    let i = 0;
    let node: HTMLElement | null = start;

    while (i < limit && node) {
        callback(node)
        i++;
        node = node.parentElement;
    }
}

/**
 * Inclusive of start, search through all nodes and their parents until either:
 * 1) the success criteria is met
 * 2) the search depth limit is reached
 * 3) the optional fail criteria is met
 * 4) there are no more parent elements
 * 
 * @returns true is the success criteria was met, false otherwise 
 */
export const searchThroughParents = ({
    start,
    successCondition,
    failCondition,
    searchDepth=20,
}: {
    start: HTMLElement | null,
    successCondition: (parent: HTMLElement) => boolean,
    failCondition?: (parent: HTMLElement) => boolean,
    searchDepth?: number,
}) => {
    let i = 0;
    let node: HTMLElement | null = start;

    while (i < searchDepth && node) {
        if (successCondition(node)) {
            return true;
        }
        if (failCondition && failCondition(node)) {
            return false;
        }
        i++;
        node = node.parentElement;
    }
}


/**
 * Check if the x and y coordinates fall within the provided client rect
 * @param rect 
 * @param x 
 * @param y 
 * @returns 
 */
export const clickedInBounds = (rect: ClientRect, x: number, y: number) => {
    return x <= rect.right && x >= rect.left && y >= rect.top && y <= rect.bottom; 
};


/**
 * Assign a value to a forwarded ref, handling MutableObjectRefs and ref assignment function cases
 * @param ref 
 * @param node 
 */
export const assignForwardedRef = (ref: ForwardedRef<any> | RefCallback<HTMLElement>, node: HTMLElement | null) => {
    if (typeof ref === "function") {
        ref(node);
    }
    else if (ref) {
        ref.current = node;
    }
}


/**
 * Combine a given string and any possible the className values from props
 * @returns a string of the passed className and any className from the passed props
 */
export const combineClassNamePropAndString = (className: string, props: ComponentPropsWithoutRef<any> | undefined): string => {
    return `${className}${props && props.className ? " " + props.className : ""}`;
}