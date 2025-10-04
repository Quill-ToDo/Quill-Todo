import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    createContext, 
    ForwardRefRenderFunction, 
    ReactElement, 
    ReactNode, 
    SetStateAction, 
    useContext, 
    useState,
    Dispatch,
    LegacyRef, 
} from "react";
import { assignForwardedRef, combineClassNamePropAndString } from '@util/jsTools';

import { FloatingUiAttachedPopup, FloatingUiPersistentPopup } from "../3rd-party/FloatingUiHelpers";
import "./popup.css"
import { ReferenceType } from "@floating-ui/react";

// Options used in both "attached" and "persistent" popup types
export type InnerPopupProps = {
    position?: "centered" | "positioned",
    placement?: "left" | "bottom" | "right" | "top" | "centered" | "auto",
    alignment?: "start" | "middle" | "end",
    doneLoading?: boolean,
    draggable?: boolean,
    useDragHandle?: boolean,
    popupMargin?: number,
}
export type PopupSetupProps = {
    renderPopupContent: RenderPopUpContent,
    renderElementToClick: RenderAnchorElement,
} & InnerPopupProps;

export type PersistentProps = {
    setPopupContent: Dispatch<SetStateAction<ReactElement | null>>;
} & PopupSetupProps;

export type RenderPopUpContent = ForwardRefRenderFunction<HTMLElement, {
    closePopup: (callback?: Function)=>void,
    popupContainerProps: ComponentPropsWithoutRef<any>,
}>;

export type RenderAnchorElement = ForwardRefRenderFunction<HTMLButtonElement, {
    openPopup: (callback?: Function)=>void, 
    anchorProps: ComponentPropsWithoutRef<any>,
}>;

export type PopupSetup = { 
    openPopup: (callback?: Function)=>void,
    closePopup: (callback?: Function)=>void,
    setPopupPositioningAnchor: ((node: ReferenceType | null) => void) & ((node: ReferenceType | null) => void),
    getAnchorProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>,
};

/**
 * Given a render method for an anchor element, the content to popup, 
 * and popup configuration options, return the anchor ref element to be rendered
 * with popup listners attached.
 * If the anchor element is unmounted, the popup will as well--if this is not desired behavior, 
 * use PersistentPopupOnClick instead.
 * 
 * # renderPopUpContent requirements:
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied that will serve as the container for the popup
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.closePopup()` somewhere to close popup if desired  
 * 
 *  If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class passed in "dragHandleClass" to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return button element 
 * - apply passed ref to button element
 * - spread props in props.anchorProps to button element (as first parameter so they can be overridden if desired)
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.openPopup()` in an onClick method on returned button  
 * 
 * @returns the rendered anchor element for the popup
 */
export const AttachedPopupOnClick = observer((
    // helper to serve as an interface between Quill and any
    // 3rd party libraries.
    {   
        position="positioned",
        placement="auto",
        alignment="middle",
        doneLoading=true, 
        draggable=false, 
        useDragHandle=false,
        ...props
    } : PopupSetupProps) => {
        const defaultProps = {
            position: position,
            placement: placement,
            alignment: alignment,
            doneLoading: doneLoading,
            draggable: draggable,
            useDragHandle: useDragHandle,
        }
        return <FloatingUiAttachedPopup 
            {...props}
            {...defaultProps}
        />;
});

/**
 * Given the content to popup and popup configuration options, mount a popup to the DOM. 
 * This popup version returns a reference that an anchor element can use for positioning, but 
 * the popup will stay mounted even if the reference anchor element is unmounted from the DOM.
 * If the popup should dismount when an anchor element is, use AttachedPopupOnClick instead.
 * Also returns an open method to call when it should open the popup and a close
 * method to use in child popup content or as desired to close the popup.
 * 
 * # renderPopUpContent requirements:
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied that will serve as the container for the popup
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.closePopup()` somewhere to close popup if desired  
 * 
 *  If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class passed in "dragHandleClass" to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.openPopup()` somewhere to open popup  
 * 
 * @returns setup methods to get and set the popup content
 */
export const AnchorWithPersistentPopupAttached = observer((
    {   
        position="positioned",
        placement="right",
        alignment="middle",
        doneLoading=true, 
        draggable=false, 
        useDragHandle=false,
        ...props
    } : PopupSetupProps) => {
        // Popup helper to serve as an interface between Quill and
        // 3rd party libraries.
        // Use context to hold the popup content so that it may persist even when the anchor element
        // is unmounteds from the dom
        const popupContext = useContext(PersistentPopupContext);
        const defaultProps = {
            position: position,
            placement: placement,
            alignment: alignment,
            doneLoading: doneLoading,
            draggable: draggable,
            useDragHandle: useDragHandle,
            setPopupContent: popupContext,
        }
        return <FloatingUiPersistentPopup {...props} {...defaultProps} />;
});

export const PersistentPopupContext = createContext<Dispatch<SetStateAction<null | ReactElement>>>(() => null);
export const PersistentPopupContextProvider = ({children}: {
    children: ReactNode,
}) => {
    const [popupContent, setPopupContent] = useState<null | ReactElement>(null);

    return <PersistentPopupContext.Provider
        value={setPopupContent}
    >
        { children }
        { popupContent }
    </PersistentPopupContext.Provider>
}

/**
 * Simple popup menu containing a list of clickable items. Add the property:
 * aria-haspopup="menu"
 * to the element returned by renderElementToClick for accessibility.
 */
export const ContextMenuPopup = observer((
    {   
        labelsAndClickCallbacks,
        renderElementToClick,
        header,
        placement="right",
        alignment="middle",
        ...props
    } : {
        labelsAndClickCallbacks: {
            label: string, // Accessibility, the name
            content: ReactElement<any>,  // Content to render inside <li> and button. ex: <>{ICONS.TRASH}<p>Delete</p></>
            onClick: () => void, 
            visible: boolean, // Should this element appear in the content menu?
        }[],
        renderElementToClick: RenderAnchorElement, // Must stay a callback
        header?: ReactElement<"any">, // Optional header content for the context menu
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
    }
) => {
    return <AttachedPopupOnClick
        renderElementToClick={(props, ref) => renderElementToClick(props, ref)}
        renderPopupContent={({closePopup, popupContainerProps}, ref) => 
            <div 
              ref={ref as LegacyRef<HTMLDivElement>}
              {...popupContainerProps}
              {...{className: combineClassNamePropAndString("context-menu", popupContainerProps)}}
            >
                <menu
                    role="menu"
                >
                    { header }
                    <ul>
                        { labelsAndClickCallbacks.filter(labelAndCallback => labelAndCallback.visible)
                        .map(labelAndCallback =>

                        <li key={labelAndCallback.label}>
                            <button
                                    onClick={() => {
                                        labelAndCallback.onClick(); 
                                        closePopup( );
                                    }}
                                    aria-labelledby={labelAndCallback.label} 
                                    title={labelAndCallback.label}
                                    className={combineClassNamePropAndString(`item`, props)} 
                                    > 
                                    { labelAndCallback.content }
                                </button>
                        </li>
                    )}
                    </ul>
                </menu>
            </div>
        }
        placement={placement}
        alignment={alignment}
        > 
    </AttachedPopupOnClick>
})

